import type { Database } from "@db/mongo"
import { isAbsolute, relative } from "@std/path"
import { decodeTime } from "@std/ulid"
import {
  ensureDoesntExist,
  getDataDirectory,
  getTempDirectory,
} from "../fs/mod.ts"
import { getLogger } from "../log.ts"
import { UnprocessedDocumentModel } from "../model/documents/UnprocessedDocument.ts"
import { SYSTEM_USER } from "../model/user.ts"
import { AsyncResult, wrapAsync } from "../result.ts"

/**
 * Determines whether an unprocessed document is older than `maxAgeMs`.
 *
 * Unprocessed documents don't store a creation time, but their IDs are ULIDs,
 * which encode it.
 * @param id the ID of the unprocessed document
 * @param maxAgeMs the maximum age in milliseconds
 * @param now the current time
 * @returns `true` if the document is stale. `false` if it is not or if the
 * creation time cannot be determined (never delete in doubt).
 */
export function isStale(
  id: string,
  maxAgeMs: number,
  now: Date = new Date(),
): boolean {
  try {
    return now.getTime() - decodeTime(id) > maxAgeMs
  } catch {
    return false
  }
}

/**
 * Removes unprocessed documents older than `maxAgeMs`.
 *
 * Documents stay "unprocessed" forever if the server shuts down while they are
 * being processed. This removes their database entries and, if they live in
 * the upload directory, their files.
 * @param db the database
 * @param maxAgeMs the maximum age of an unprocessed document in milliseconds
 * @param now the current time
 * @returns the number of removed and failed documents, or an error if the
 * documents could not be loaded
 */
export async function cleanUpStaleUnprocessedDocuments(
  db: Database,
  maxAgeMs: number,
  now: Date = new Date(),
): AsyncResult<{ removed: number; failed: number }, Error> {
  const logger = getLogger("unprocessed-cleanup")
  const collection = new UnprocessedDocumentModel(db, SYSTEM_USER, false)

  const [documents, getError] = await collection.get({})
  if (getError) {
    logger.withError(getError).error("Failed to load unprocessed documents.")
    return [null, getError]
  }

  const uploadDirectory = getDataDirectory("unprocessed")
  let removed = 0
  let failed = 0

  for (const document of documents) {
    if (!isStale(document.id, maxAgeMs, now)) {
      continue
    }
    const docLogger = logger.child().withContext({
      unprocessedDocumentId: document.id,
      userId: document.userId,
    })

    // Only delete files we own. Files ingested from the ingest folder live
    // elsewhere and may have been picked up again by the folder ingest.
    const relativePath = relative(uploadDirectory, document.path)
    const ownsFile = !relativePath.startsWith("..") && !isAbsolute(relativePath)

    const [_fileRes, fileError] = await wrapAsync(
      ownsFile ? ensureDoesntExist(document.path) : Promise.resolve(),
    )
    const [_tempRes, tempError] = await wrapAsync(
      ensureDoesntExist(getTempDirectory(document.id)),
    )
    const cleanupError = fileError ?? tempError
    if (cleanupError) {
      failed++
      docLogger.withError(cleanupError).error(
        "Failed to remove files of stale unprocessed document.",
      )
      continue
    }

    const [_result, removeError] = await collection.remove(document.id)
    if (removeError) {
      failed++
      docLogger.withError(removeError).error(
        "Failed to remove stale unprocessed document.",
      )
      continue
    }
    removed++
    docLogger.info("Removed stale unprocessed document.")
  }

  return [{ removed, failed }, null]
}
