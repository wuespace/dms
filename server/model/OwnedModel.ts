import type { Database } from "@db/mongo"
import { BaseModel, Query } from "./BaseModel.ts"
import { SYSTEM_USER, type User } from "./user.ts"

/**
 * A model that is owned by a user.
 * If `enforceOwnership` is true, the model will only return documents that
 * belong to the user when querying.
 *
 * Use {@link OwnedModel.userIdQuery} to get the query that enforces ownership
 * if you query the database directly:
 *
 * ```ts
 * const query = {
 *   ...OwnedModel.userIdQuery,
 *   // other query
 * }
 * await db.find(query);
 * ```
 *
 * Objects belonging to the {@link SYSTEM_USER} are considered to be owned by
 * the system and will be visible to all users.
 */
export abstract class OwnedModel<T extends { userId?: string | null }>
  extends BaseModel<T> {
  /**
   * The query that enforces ownership.
   * Only documents that belong to the user or that have no owner will be
   * returned.
   *
   * @example
   * ```ts
   * { userId: { $in: [user.id, SYSTEM_USER.id] } }
   * ```
   * @protected
   */
  protected get userIdQuery() {
    return {
      userId: {
        $in: [this.user.id, SYSTEM_USER.id],
      },
    } as const
  }

  /**
   * Creates a new OwnedModel instance.
   * If `enforceOwnership` is true, the model will only return documents that
   * belong to the user when querying.
   * @param db the MongoDB database instance.
   * @param user the user that owns the documents.
   * @param enforceOwnership whether to enforce ownership when querying.
   * If false, all documents will be returned regardless of ownership.
   * If true, only documents that belong to the user (or to no user) will be returned.
   * Defaults to true.
   * See the {@link userIdQuery} property for the query that enforces ownership.
   */
  constructor(
    db: Database,
    public readonly user: User,
    protected readonly enforceOwnership = true,
  ) {
    super(db)
  }

  protected override _preprocessQueries(queries: Query | Query[]): Query {
    if (Array.isArray(queries) && this.enforceOwnership) {
      queries = [...queries, this.userIdQuery]
    } else if (this.enforceOwnership) {
      queries = [queries, this.userIdQuery]
    }

    return super._preprocessQueries(queries)
  }
}
