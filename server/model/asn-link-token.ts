/**
 * Helpers for ASN magic link tokens.
 *
 * Only the SHA-256 hash of a token is ever stored; the raw token is shown to
 * the creator exactly once.
 */

export type AsnLinkStatus = "valid" | "used" | "revoked" | "expired"

/** Generates a random, URL-safe 256-bit token. */
export function generateAsnLinkToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "")
}

/** Hashes a token for storage/lookup. */
export async function hashAsnLinkToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  )
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

/** Determines whether a link can still be redeemed. */
export function getAsnLinkStatus(
  link: {
    expiresAt: Date
    usedAt?: Date | null
    revokedAt?: Date | null
  },
  now = new Date(),
): AsnLinkStatus {
  if (link.revokedAt) return "revoked"
  if (link.usedAt) return "used"
  if (link.expiresAt.getTime() <= now.getTime()) return "expired"
  return "valid"
}
