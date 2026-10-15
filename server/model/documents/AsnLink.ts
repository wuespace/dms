import { z } from "@zod/zod"
import type { Database } from "@db/mongo"
import { ASN_LINKS_COLLECTION } from "../collections.ts"
import { BaseModel } from "../BaseModel.ts"
import type { User } from "../user.ts"
import type { AsyncResult } from "../../result.ts"
import {
  type AsnLinkStatus,
  generateAsnLinkToken,
  getAsnLinkStatus,
  hashAsnLinkToken,
} from "../asn-link-token.ts"

/**
 * A magic link that allows any logged-in user to archive one document under
 * exactly one ASN, regardless of their folder permissions.
 */
export interface AsnLink {
  id: string
  tokenHash: string
  asn: string
  createdBy: User["id"]
  createdAt: Date
  expiresAt: Date
  usedAt?: Date | null
  usedBy?: User["id"] | null
  revokedAt?: Date | null
}

/** The link is unknown, expired, used, revoked or for another ASN. */
export class AsnLinkError extends Error {
  constructor(
    public readonly reason: AsnLinkStatus | "not-found" | "asn-mismatch",
    options?: ErrorOptions,
  ) {
    super(`ASN link cannot be used: ${reason}`, options)
  }
}

export class AsnLinkModel extends BaseModel<AsnLink> {
  constructor(db: Database, public readonly user: User) {
    super(db)
  }

  override get collection() {
    return ASN_LINKS_COLLECTION
  }

  override get schema() {
    return z.object({
      id: z.string(),
      tokenHash: z.string(),
      asn: z.string(),
      createdBy: z.string(),
      createdAt: z.coerce.date(),
      expiresAt: z.coerce.date(),
      usedAt: z.coerce.date().nullish(),
      usedBy: z.string().nullish(),
      revokedAt: z.coerce.date().nullish(),
    })
  }

  /**
   * Creates a link for the given ASN.
   * @returns the stored link and the raw token (which is not retrievable later)
   */
  async create(
    asn: string,
    ttlDays: number,
  ): AsyncResult<{ link: AsnLink; token: string }, Error> {
    const token = generateAsnLinkToken()
    const now = new Date()
    const link: AsnLink = {
      id: crypto.randomUUID(),
      tokenHash: await hashAsnLinkToken(token),
      asn,
      createdBy: this.user.id,
      createdAt: now,
      expiresAt: new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000),
      usedAt: null,
      usedBy: null,
      revokedAt: null,
    }
    const [_inserted, error] = await this._insertOne(link)
    if (error) return [null, error]
    return [{ link, token }, null]
  }

  /** All links created by the current user, newest first. */
  listByCreator() {
    return this._find({ createdBy: this.user.id }, { createdAt: -1 })
  }

  /** Revokes an unused link created by the current user. */
  async revoke(id: string): AsyncResult<void, Error> {
    const [result, error] = await this._toResult(
      this.db.collection(this.collection).updateOne(
        { id, createdBy: this.user.id, usedAt: null, revokedAt: null },
        { $set: { revokedAt: new Date() } },
      ),
    )
    if (error) return [null, error]
    if (result.matchedCount === 0) {
      return [null, new Error("Link not found or no longer revocable")]
    }
    return [undefined, null]
  }

  /**
   * Looks up a token and checks that it can still be redeemed.
   * @param expectedAsn if given, the link must be bound to this ASN
   */
  async findValidByToken(
    token: string,
    expectedAsn?: string,
  ): AsyncResult<AsnLink, AsnLinkError | Error> {
    const [link, error] = await this._findOne({
      tokenHash: await hashAsnLinkToken(token),
    })
    if (error) return [null, new AsnLinkError("not-found", { cause: error })]
    const status = getAsnLinkStatus(link)
    if (status !== "valid") return [null, new AsnLinkError(status)]
    if (expectedAsn !== undefined && link.asn !== expectedAsn) {
      return [null, new AsnLinkError("asn-mismatch")]
    }
    return [link, null]
  }

  /**
   * Atomically marks a valid link for `asn` as used by the current user.
   * Fails if the link was concurrently used, revoked or expired.
   */
  async consume(token: string, asn: string): AsyncResult<AsnLink, Error> {
    const [link, findError] = await this.findValidByToken(token, asn)
    if (findError) return [null, findError]

    const now = new Date()
    const [result, error] = await this._toResult(
      this.db.collection(this.collection).updateOne(
        {
          id: link.id,
          usedAt: null,
          revokedAt: null,
          expiresAt: { $gt: now },
        },
        { $set: { usedAt: now, usedBy: this.user.id } },
      ),
    )
    if (error) return [null, error]
    if (result.matchedCount === 0) {
      return [null, new AsnLinkError("used")]
    }
    return [{ ...link, usedAt: now, usedBy: this.user.id }, null]
  }

  /** Makes a consumed link usable again (e.g., when archiving failed). */
  async release(id: string): AsyncResult<void, Error> {
    const [_result, error] = await this._toResult(
      this.db.collection(this.collection).updateOne(
        { id, usedBy: this.user.id },
        { $set: { usedAt: null, usedBy: null } },
      ),
    )
    if (error) return [null, error]
    return [undefined, null]
  }
}
