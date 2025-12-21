import { basename } from "@std/path"
import { monotonicUlid } from "@std/ulid"
import { getDB } from "../db/getDB.ts"
import { unprocessedToInbox } from "../document-lifecycle/unprocessed-to-inbox.ts"
import { InboxDocument } from "../model/documents/InboxDocument.ts"
import { UnprocessedDocumentModel } from "../model/documents/UnprocessedDocument.ts"
import { SYSTEM_USER, type User } from "../model/user.ts"
import { AsyncResult } from "../result.ts"

/**
 * Ingests a document from the given path.
 * Acts as {@link SYSTEM_USER} unless a user is provided.
 * @param path path to the original document
 * @param user the user who is ingesting the document. Defaults to {@link SYSTEM_USER}
 * @returns the inbox document that was created
 */
export async function ingestDocument(
  path: string,
  user: User = SYSTEM_USER,
): AsyncResult<InboxDocument, Error> {
  const id = monotonicUlid()

  const [db, dbError] = await getDB()
  if (dbError) {
    return [null, dbError]
  }

  const unprocessedCollection = new UnprocessedDocumentModel(
    db,
    user,
  )

  const [unprocessedDocument, unprocessedDocumentError] =
    await unprocessedCollection.add({
      id,
      path,
      originalFilename: basename(path),
    })

  if (unprocessedDocumentError) {
    return [null, unprocessedDocumentError]
  }

  const [inboxDocument, inboxDocumentError] = await unprocessedToInbox(
    db,
    unprocessedDocument.id,
    user,
  )

  if (inboxDocumentError) {
    return [null, inboxDocumentError]
  }

  return [inboxDocument, null]
}
