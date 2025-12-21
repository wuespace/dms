import { Database } from "@db/mongo"
import { InboxDocumentModel } from "../model/documents/InboxDocument.ts"
import { User } from "../model/user.ts"
import { getDocumentDirectory } from "../fs/mod.ts"
import { AsyncResult, wrapAsync } from "../result.ts"
import { getLogger } from "../log.ts"

export async function dismissInboxDocument(
  db: Database,
  inboxDocumentId: string,
  user: User,
): AsyncResult<void, Error> {
  const logger = getLogger("dismiss-inbox-document").withContext({
    userId: user.id,
    userRoles: user.roles,
    inboxDocumentId,
    lifecycleId: "inbox-dismiss",
    lifecycleRunId: crypto.randomUUID(),
  })

  const inboxCollection = new InboxDocumentModel(db, user)

  logger.info(
    "Beginning transition from inbox to dismissed for document.",
  )
  const [inboxDocument, getInboxDocError] = await inboxCollection
    .getOne(
      inboxDocumentId,
    )
  if (getInboxDocError) {
    logger.withError(getInboxDocError).error(
      "Error retrieving inbox document.",
    )
    throw getInboxDocError
  }
  logger.withContext({
    inboxDocument: {
      ...inboxDocument,
      content: `[REDACTED; ${inboxDocument.content.length} bytes]`,
    },
  })
  if (inboxDocument.id !== inboxDocumentId) {
    logger.withContext({ inboxDocumentId, actualId: inboxDocument.id }).error(
      "Document ID Mismatch. Aborting dismissal.",
    )
    return [
      null,
      new Error("Document ID Mismatch. Aborting dismissal.", {
        cause: {
          expectedId: inboxDocumentId,
          actualId: inboxDocument.id,
        },
      }),
    ]
  }

  const [_, removeDocError] = await inboxCollection
    .remove(
      inboxDocumentId,
    )
  if (removeDocError) {
    logger.withError(removeDocError).error(
      "Error removing inbox document from database.",
    )
    return [null, removeDocError]
  }

  const [_fsRmRes, fsRmError] = await wrapAsync(
    Deno.remove(getDocumentDirectory(inboxDocumentId), {
      recursive: true,
    }),
  )
  if (fsRmError) {
    logger.withError(fsRmError).error(
      "Error removing document directory.",
      "Database entry was already removed, please manually remove the directory.",
    )
  }

  logger.info(
    "Successfully transitioned document from inbox to dismissed.",
  )

  return [undefined, null]
}
