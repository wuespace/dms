import { Database } from "@db/mongo"
import {
  ensureDoesntExist,
  getDocumentDirectory,
  getTempDirectory,
} from "../fs/mod.ts"
import {
  INBOX_DOCUMENTS_COLLECTION,
  UNPROCESSED_DOCUMENTS_COLLECTION,
} from "../model/collections.ts"
import {
  type ProcessingError,
  ProcessingErrorModel,
} from "../model/documents/ProcessingError.ts"
import { getLogger } from "../log.ts"

export async function unprocessedToError(
  db: Database,
  id: string,
  error: Error,
): Promise<void> {
  const logger = getLogger("unprocessed-to-error").withContext({
    documentId: id,
    reason: error.toString(),
    lifecycleId: "unprocessed-to-error",
    lifecycleRunId: crypto.randomUUID(),
  })
  logger.info("Transitioning unprocessed document to error state.")
  const errorCollection = new ProcessingErrorModel(db)
  const [_result, insertError] = await errorCollection.add(
    {
      id,
      error: error.toString(),
      time: new Date(),
    } satisfies ProcessingError,
  )

  if (insertError) {
    logger.withError(insertError).error(
      "Failed to add processing error for document.",
    )
    throw insertError
  }

  await db.collection(UNPROCESSED_DOCUMENTS_COLLECTION).deleteOne({
    id,
  })
  await db.collection(INBOX_DOCUMENTS_COLLECTION).deleteOne({
    id,
  })

  await ensureDoesntExist(getDocumentDirectory(id))
  await ensureDoesntExist(getTempDirectory(id))
  logger.info("Successfully transitioned unprocessed document to error state.")
}
