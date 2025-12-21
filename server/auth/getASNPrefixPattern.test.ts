import { expect } from "@std/expect"
import { describe } from "@std/testing/bdd"
import { it } from "node:test"
import { getASNPrefixPattern } from "./getASNPrefixPattern.ts"

describe("getASNPrefixPattern", () => {
  it("should create correct regex patterns", () => {
    const pattern1 = getASNPrefixPattern("1", ["1", "2"])
    expect(pattern1.test("111")).toBe(true)
    expect(pattern1.test("121")).toBe(true)
    expect(pattern1.test("13")).toBe(false)
    expect(pattern1.test("21")).toBe(false)

    const pattern2 = getASNPrefixPattern("2", ["1"])
    expect(pattern2.test("211")).toBe(true)
    expect(pattern2.test("212222")).toBe(true)
    expect(pattern2.test("22")).toBe(false)
    expect(pattern2.test("31")).toBe(false)
  })

  it("should reject ASNs without a document number", () => {
    const pattern = getASNPrefixPattern("3", ["4", "5"])
    expect(pattern.test("34")).toBe(false)
    expect(pattern.test("35")).toBe(false)
    expect(pattern.test("341")).toBe(true)
    expect(pattern.test("35222")).toBe(true)
  })
})
