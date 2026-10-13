import { describe, it } from "@std/testing/bdd"
import { expect } from "@std/expect"
import {
  generateAsnLinkToken,
  getAsnLinkStatus,
  hashAsnLinkToken,
} from "./asn-link-token.ts"

describe("ASN link tokens", () => {
  it("generates unique URL-safe tokens", () => {
    const a = generateAsnLinkToken()
    const b = generateAsnLinkToken()
    expect(a).not.toEqual(b)
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/)
  })

  it("hashes deterministically without revealing the token", async () => {
    const hash = await hashAsnLinkToken("secret")
    expect(hash).toEqual(await hashAsnLinkToken("secret"))
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
    expect(hash).not.toContain("secret")
  })
})

describe("getAsnLinkStatus", () => {
  const now = new Date("2026-01-10T00:00:00Z")
  const future = new Date("2026-02-01T00:00:00Z")
  const past = new Date("2026-01-01T00:00:00Z")

  it("is valid when unused, unrevoked and not expired", () => {
    expect(getAsnLinkStatus({ expiresAt: future }, now)).toEqual("valid")
  })
  it("is expired after expiresAt", () => {
    expect(getAsnLinkStatus({ expiresAt: past }, now)).toEqual("expired")
  })
  it("is used once consumed", () => {
    expect(getAsnLinkStatus({ expiresAt: future, usedAt: past }, now))
      .toEqual("used")
  })
  it("is revoked, taking precedence over other states", () => {
    expect(
      getAsnLinkStatus(
        { expiresAt: past, usedAt: past, revokedAt: past },
        now,
      ),
    ).toEqual("revoked")
  })
})
