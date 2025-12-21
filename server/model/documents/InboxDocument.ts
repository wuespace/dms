import { z } from "@zod/zod"
import { Database } from "@db/mongo"
import { INBOX_DOCUMENTS_COLLECTION } from "../collections.ts"
import { OwnedModel } from "../OwnedModel.ts"
import type { Tag } from "../tags.ts"
import { SYSTEM_USER, type User } from "../user.ts"

export interface InboxDocument {
  id: string
  userId: User["id"]
  originalFilePath: string
  processedFilePath: string
  thumbnailPath: string
  retinaThumbnailPath: string
  suggestedASN: string
  suggestedTags: Tag[]
  suggestedTitle: string
  content: string
  date: Date
}

export class InboxDocumentModel extends OwnedModel<InboxDocument> {
  constructor(db: Database, user: User) {
    super(db, user)
  }

  override get collection() {
    return INBOX_DOCUMENTS_COLLECTION
  }

  override get schema() {
    return z.object({
      id: z.string(),
      userId: z.string(),
      originalFilePath: z.string(),
      processedFilePath: z.string(),
      thumbnailPath: z.string(),
      retinaThumbnailPath: z.string(),
      suggestedASN: z.string(),
      suggestedTags: z.array(z.string()),
      suggestedTitle: z.string(),
      content: z.string(),
      date: z.coerce.date(),
    })
  }

  get() {
    return this._find({})
  }

  getOne(id: string) {
    return this._findOne({ id })
  }

  add(document: InboxDocument) {
    if (
      document.userId !== this.user.id && document.userId !== SYSTEM_USER.id
    ) {
      return [
        null,
        new Error("User ID does not match", {
          cause: {
            expectedId: this.user.id,
            actualId: document.userId,
          },
        }),
      ] as const
    }
    return this._insertOne(document)
  }

  count() {
    return this._count({})
  }

  remove(id: string) {
    return this._deleteOne({ id }, true)
  }
}
