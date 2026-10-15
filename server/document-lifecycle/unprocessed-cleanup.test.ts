import { describe, it } from "@std/testing/bdd"
import { expect } from "@std/expect"
import { ulid } from "@std/ulid"
import { isStale } from "./unprocessed-cleanup.ts"

const DAY = 24 * 60 * 60 * 1000
const now = new Date("2026-03-10T12:00:00Z")

describe("isStale", () => {
  it("is false for fresh documents", () => {
    expect(isStale(ulid(now.getTime()), 2 * DAY, now)).toBe(false)
  })

  it("is false right below the threshold", () => {
    expect(isStale(ulid(now.getTime() - 2 * DAY + 1000), 2 * DAY, now))
      .toBe(false)
  })

  it("is true above the threshold", () => {
    expect(isStale(ulid(now.getTime() - 3 * DAY), 2 * DAY, now)).toBe(true)
  })

  it("is false if the ID is not a ULID", () => {
    expect(isStale("not-a-ulid", 2 * DAY, now)).toBe(false)
  })
})
