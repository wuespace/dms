import type { Database } from "@db/mongo"
import type { Config } from "../getConfig.ts"
import {
  type ArchivedDocument,
  ArchivedDocumentModel,
} from "../model/documents/ArchivedDocument.ts"
import { InboxDocumentModel } from "../model/documents/InboxDocument.ts"
import { parseTags } from "../model/tags.ts"
import type { User } from "../model/user.ts"
import type { AsyncResult } from "../result.ts"
import { getLogger } from "../log.ts"
import { redactContent } from "./util/redact.ts"

export async function inboxToArchive(
  db: Database,
  inboxDocumentId: string,
  archivedDocumentData: Partial<ArchivedDocument>,
  user: User,
  config: Config,
): AsyncResult<ArchivedDocument, Error> {
  const logger = getLogger("inbox-to-archive").withContext({
    userId: user.id,
    userRoles: user.roles,
    inboxDocumentId,
    archivedDocumentData: redactContent(archivedDocumentData),
    config,
    lifecycleId: "inbox-to-archived",
    lifecycleRunId: crypto.randomUUID(),
  })

  logger.info("Starting inbox to archive process.")

  if (!archivedDocumentData.id) {
    // Re-use the inbox document ID
    archivedDocumentData.id = inboxDocumentId
  }
  logger.withContext({
    archivedDocumentData: redactContent(archivedDocumentData),
  })

  if (archivedDocumentData.id !== inboxDocumentId) {
    // Since we're re-using the inbox document ID, this should never happen
    logger.withMetadata({
      inboxDocumentId: inboxDocumentId,
      archivedDocumentId: archivedDocumentData.id,
    }).fatal("Document ID mismatch during inbox to archive transition")
    return [
      null,
      new InboxToArchiveError(
        `Document ID mismatch: ${archivedDocumentData.id} !== ${inboxDocumentId}`,
      ),
    ]
  }

  const inboxCollection = new InboxDocumentModel(db, user)
  const archivedCollection = new ArchivedDocumentModel(db, user, config)

  const [inboxDocument, inboxDocumentError] = await inboxCollection.getOne(
    inboxDocumentId,
  )
  logger.withContext({ inboxDocument: redactContent(inboxDocument) })

  if (inboxDocumentError) {
    logger.withError(inboxDocumentError).error(
      "Error retrieving inbox document.",
    )
    return [null, inboxDocumentError]
  }

  const [tags, parseTagsError] = parseTags(
    archivedDocumentData.tags ?? inboxDocument.suggestedTags,
  )
  logger.withContext({ tags })

  if (parseTagsError) {
    logger.withError(parseTagsError).warn(
      "Error parsing tags for archived document.",
      "Defaulting to empty tag list.",
    )
  }

  const archivedDocument: ArchivedDocument = {
    ...inboxDocument,
    ...archivedDocumentData,
    title: archivedDocumentData.title ?? inboxDocument.suggestedTitle,
    asn: archivedDocumentData.asn ?? inboxDocument.suggestedASN,
    tags: parseTagsError ? [] : tags,
    permissions: {
      read: archivedDocumentData.permissions?.read ?? [],
      write: archivedDocumentData.permissions?.write ?? [],
    },
  }
  logger.withContext({ archivedDocument: redactContent(archivedDocument) })

  // Check that the ASN is unique
  const [isArchived, isArchivedError] = await archivedCollection.isASNArchived(
    archivedDocument.asn,
  )

  if (isArchivedError) {
    logger.withError(isArchivedError).error(
      "Document ASN uniqueness check failed.",
    )
    return [null, isArchivedError]
  }

  if (isArchived) {
    logger.warn("Document ASN is already archived.")
    return [
      null,
      new InboxToArchiveError(
        `Document with ASN ${archivedDocument.asn} already archived`,
      ),
    ]
  }

  // We're all good – move the document to the archive
  const [insertResult, insertError] = await archivedCollection.insert(
    archivedDocument,
  )
  logger.withContext({ insertResult: redactContent(insertResult) })

  if (insertError) {
    logger.withError(insertError).error("Error inserting archived document.")
    return [
      null,
      insertError,
    ]
  }

  const [_result, deleteInboxError] = await inboxCollection.remove(
    inboxDocumentId,
  )

  if (deleteInboxError) {
    logger.withError(deleteInboxError).error(
      "Error deleting inbox document after archiving.",
    )
    return [null, deleteInboxError]
  }

  logger.info("Successfully transitioned document from inbox to archived.")
  return [insertResult, null]
}

export class InboxToArchiveError extends Error {}
