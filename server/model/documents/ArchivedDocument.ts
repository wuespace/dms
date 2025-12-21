import { Database } from "@db/mongo"
import { z } from "@zod/zod"
import { AsyncResult } from "../../result.ts"
import { ARCHIVED_DOCUMENTS_COLLECTION } from "../collections.ts"
import type { Tag } from "../tags.ts"
import { BaseModel, Query } from "../BaseModel.ts"
import { SYSTEM_USER, type User } from "../user.ts"
import type { Config } from "../../getConfig.ts"
import { getPermissionQuery } from "../../auth/getPermissionQuery.ts"
import { getAuthorizedPatterns } from "../../auth/getAuthorizedPatterns.ts"

export interface ArchivedDocument {
  id: string
  originalFilePath: string
  processedFilePath: string
  thumbnailPath: string
  retinaThumbnailPath: string
  title: string
  asn: string
  tags: Tag[]
  content: string
  date: Date
  permissions: {
    read: string[]
    write: string[]
  }
}

export class ArchivedDocumentModel extends BaseModel<ArchivedDocument> {
  constructor(
    db: Database,
    public readonly user: User,
    public readonly config: Config,
  ) {
    super(db)
  }

  override get collection(): string {
    return ARCHIVED_DOCUMENTS_COLLECTION
  }

  override get schema() {
    return z.object({
      id: z.string(),
      originalFilePath: z.string(),
      processedFilePath: z.string(),
      thumbnailPath: z.string(),
      retinaThumbnailPath: z.string(),
      title: z.string(),
      asn: z.string(),
      tags: z.array(z.string()),
      content: z.string(),
      date: z.coerce.date(),
      permissions: z.object({
        read: z.array(z.string()),
        write: z.array(z.string()),
      }),
    })
  }

  protected get readPermissionQuery() {
    return getPermissionQuery(this.user, this.config)
  }

  protected get writePermissionQuery() {
    return getPermissionQuery(this.user, this.config, true)
  }

  get(...additionalQueries: Query[]): AsyncResult<ArchivedDocument[], Error> {
    return this._find([this.readPermissionQuery, ...additionalQueries])
  }

  search(
    query: string,
    ...additionalQueries: Query[]
  ): AsyncResult<ArchivedDocument[], Error> {
    return this._find([
      { $text: { $search: query } },
      this.readPermissionQuery,
      ...additionalQueries,
    ])
  }

  insert(
    document: ArchivedDocument,
  ) {
    if (!this.hasASNPermission(document.asn, true)) {
      return [
        null,
        new Error("User does not have permission to write to ASN", {
          cause: {
            asn: document.asn,
            userRoles: this.user.roles,
            authorizedPatterns: getAuthorizedPatterns(
              this.user,
              this.config,
              true,
            ).map((p) => p.source),
          },
        }),
      ] as const
    }
    return this._insertOne(document)
  }

  update(
    id: string,
    document: Partial<ArchivedDocument>,
  ) {
    return this._update([{ id }, this.writePermissionQuery], document, true)
  }

  hasASNPermission(asn: string, writePermissions = false): boolean {
    if (this.user === SYSTEM_USER) {
      // System user can write to any ASN
      return true
    }
    return getAuthorizedPatterns(this.user, this.config, writePermissions).some(
      (pattern) => pattern.test(asn),
    )
  }

  isASNArchived(asn: string): AsyncResult<boolean, Error> {
    return this._exists({ asn })
  }
}
