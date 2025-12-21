import { z } from "@zod/zod"
import { Database } from "@db/mongo"
import { monotonicUlid } from "@std/ulid"
import { AsyncResult, zParseResult } from "../../result.ts"
import { type Query } from "../BaseModel.ts"
import { UNPROCESSED_DOCUMENTS_COLLECTION } from "../collections.ts"
import { OwnedModel } from "../OwnedModel.ts"
import { User } from "../user.ts"

export interface UnprocessedDocument {
  id: string
  userId: User["id"]
  originalFilename: string
  path: string
}

export class UnprocessedDocumentModel extends OwnedModel<UnprocessedDocument> {
  constructor(db: Database, user: User) {
    super(db, user)
  }

  override get collection() {
    return UNPROCESSED_DOCUMENTS_COLLECTION
  }

  override get schema() {
    return z.object({
      id: z.string(),
      userId: z.string(),
      originalFilename: z.string(),
      path: z.string(),
    })
  }

  get(
    query: Query | Query[],
  ): AsyncResult<UnprocessedDocument[], Error> {
    return this._find(query)
  }

  getOne(id: string): AsyncResult<UnprocessedDocument, Error> {
    return this._findOne({ id })
  }

  add(
    input: Partial<UnprocessedDocument>,
  ): AsyncResult<UnprocessedDocument, Error> {
    const [document, documentParseError] = zParseResult(
      z.object({
        id: z.string().default(() => monotonicUlid()),
        userId: z.string().default(() => this.user.id),
        originalFilename: z.string().default(() => "Untitled"),
        path: z.string(),
      }),
      input,
    )

    if (documentParseError) {
      return Promise.resolve([null, documentParseError])
    }

    return this._insertOne(document)
  }

  remove(id: string): AsyncResult<number, Error> {
    return this._deleteOne({ id })
  }
}
