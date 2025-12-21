import { Database } from "@db/mongo"
import { basename } from "@std/path"
import { processDocument } from "../document-processing/mod.ts"
import {
  ensureDoesntExist,
  getDocumentDirectory,
  getTempDirectory,
} from "../fs/mod.ts"
import {
  InboxDocument,
  InboxDocumentModel,
} from "../model/documents/InboxDocument.ts"
import { UnprocessedDocumentModel } from "../model/documents/UnprocessedDocument.ts"
import type { User } from "../model/user.ts"
import { unprocessedToError } from "./unprocessed-to-error.ts"
import { AsyncResult } from "../result.ts"
import { getLogger, runWithLogContext } from "../log.ts"
import { redactContent } from "./util/redact.ts"

export async function unprocessedToInbox(
  db: Database,
  unprocessedDocumentId: string,
  user: User,
): AsyncResult<InboxDocument, Error> {
  const logger = getLogger("unprocessed-to-inbox").withContext({
    userId: user.id,
    userRoles: user.roles,
    unprocessedDocumentId,
    lifecycleId: "unprocessed-to-inbox",
    lifecycleRunId: crypto.randomUUID(),
  })
  logger.info("Starting transition from unprocessed to inbox.")
  try {
    const unprocessedCollection = new UnprocessedDocumentModel(db, user)
    const inboxCollection = new InboxDocumentModel(db, user)

    logger.info("Beginning transition from unprocessed to inbox.")
    const [unprocessedDocument, getUnprocessedDocError] =
      await unprocessedCollection
        .getOne(
          unprocessedDocumentId,
        )
    if (getUnprocessedDocError) {
      logger.withError(getUnprocessedDocError).error(
        "Error retrieving unprocessed document.",
      )
      throw getUnprocessedDocError
    }
    logger.withContext({ unprocessedDocument })

    const [documentProcessingResult, documentProcessingError] =
      await runWithLogContext(
        logger.getContext(),
        () => processDocument(unprocessedDocument.path),
      )
    if (documentProcessingError) {
      logger.withError(documentProcessingError).error(
        "Error processing document.",
      )
      throw documentProcessingError
    }
    logger.withContext({
      documentProcessingResult: redactContent(
        documentProcessingResult,
        "extractedTextContent",
      ),
    })
    await Deno.remove(unprocessedDocument.path)
    const [_, removeDocError] = await unprocessedCollection
      .remove(
        unprocessedDocumentId,
      )
    if (removeDocError) {
      logger.withError(removeDocError).error(
        "Error removing unprocessed document after processing.",
      )
      throw removeDocError
    }

    const inboxId = unprocessedDocumentId // no need to re-invent the wheel

    await Deno.mkdir(getDocumentDirectory(inboxId), {
      recursive: true,
    })
    await Deno.writeFile(
      getDocumentDirectory(inboxId, "meta-unprocessed.json"),
      new TextEncoder().encode(
        JSON.stringify(unprocessedDocument, null, 2),
      ),
    )
    await Deno.writeFile(
      getDocumentDirectory(inboxId, "meta-processing.json"),
      new TextEncoder().encode(
        JSON.stringify(documentProcessingResult, null, 2),
      ),
    )

    const inboxDocument: InboxDocument = {
      id: inboxId,
      userId: unprocessedDocument.userId,
      originalFilePath: getDocumentDirectory(
        inboxId,
        basename(documentProcessingResult.originalFilePath),
      ),
      processedFilePath: getDocumentDirectory(
        inboxId,
        basename(documentProcessingResult.ocredPdfFilePath),
      ),
      thumbnailPath: getDocumentDirectory(
        inboxId,
        basename(documentProcessingResult.thumbnailPath),
      ),
      retinaThumbnailPath: getDocumentDirectory(
        inboxId,
        basename(documentProcessingResult.retinaThumbnailPath),
      ),
      suggestedASN: documentProcessingResult.suggestedASN,
      suggestedTags: documentProcessingResult.suggestedTags,
      suggestedTitle: documentProcessingResult.suggestedTitle ||
        unprocessedDocument.originalFilename,
      content: documentProcessingResult.extractedTextContent,
      date: documentProcessingResult.date,
    }
    logger.withContext({ inboxDocument: redactContent(inboxDocument) })

    await Deno.writeFile(
      getDocumentDirectory(inboxId, "meta-inbox.json"),
      new TextEncoder().encode(JSON.stringify(inboxDocument, null, 2)),
    )

    // Copy files to folder
    await Deno.copyFile(
      documentProcessingResult.originalFilePath,
      inboxDocument.originalFilePath,
    )
    await Deno.copyFile(
      documentProcessingResult.ocredPdfFilePath,
      inboxDocument.processedFilePath,
    )
    await Deno.copyFile(
      documentProcessingResult.thumbnailPath,
      inboxDocument.thumbnailPath,
    )
    await Deno.copyFile(
      documentProcessingResult.retinaThumbnailPath,
      inboxDocument.retinaThumbnailPath,
    )

    const [insertedInboxDocument, addInboxDocError] = await inboxCollection.add(
      inboxDocument,
    )
    logger.withContext({
      insertedInboxDocument: redactContent(insertedInboxDocument),
    })

    if (addInboxDocError) {
      logger.withError(addInboxDocError).error(
        "Error adding inbox document to database.",
      )
      throw addInboxDocError
    }

    if (insertedInboxDocument.id !== inboxId) {
      logger.withMetadata({
        expectedInboxDocumentId: inboxId,
        actualInboxDocumentId: insertedInboxDocument.id,
      }).error("Inserted inbox document ID does not match expected ID.")
      throw new Error(
        `Expected inserted inbox document ID to be ${inboxId}, got ${insertedInboxDocument.id}`,
      )
    }

    const tempDir = getTempDirectory(unprocessedDocumentId)
    await ensureDoesntExist(tempDir)

    logger.withContext({ deletedTempDir: tempDir })

    logger.info(
      "Successfully transitioned document from unprocessed to inbox.",
    )

    return [inboxDocument, null]
  } catch (e) {
    if (!(e instanceof Error)) {
      logger.withError(e).error(
        "Unknown non-Error thrown during unprocessed to inbox transition.",
        "Starting unprocessed to error transition.",
      )
      await unprocessedToError(
        db,
        unprocessedDocumentId,
        new Error("Unknown error: " + e, {
          cause: e,
        }),
      )
      return [null, new Error("Unknown error: " + e)]
    }
    logger.withError(e).error(
      "Error during unprocessed to inbox transition.",
      "Starting unprocessed to error transition.",
    )
    await unprocessedToError(db, unprocessedDocumentId, e)
    return [null, e]
  }
}
