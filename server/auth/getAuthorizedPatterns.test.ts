import { describe, it } from "@std/testing/bdd"
import { expect } from "@std/expect"
import { Config } from "../getConfig.ts"
import { getAuthorizedPatterns } from "./getAuthorizedPatterns.ts"
import { getASNPrefixPattern } from "./getASNPrefixPattern.ts"

const config: Config = {
  asnPrefix: "WBD",
  publicTags: [],
  folders: [
    {
      label: "Folder 1",
      prefix: "1",
      read: ["reader"],
      write: ["writer"],
      registers: {
        "1": "Register 1",
        "2": "Register 2",
      },
    },
    {
      label: "Admin-Only Folder",
      prefix: "2",
      read: [],
      write: ["admin"],
      registers: {
        "1": "Admin Register 1",
      },
    },
  ],
}

describe("getAuthorizedPatterns", () => {
  describe("reader role", () => {
    const user = { roles: ["reader"] }

    it("should grant read permission for a reader role to 1", () => {
      const readPatterns = getAuthorizedPatterns(user, config, false)
      expect(readPatterns).toContainEqual(getASNPrefixPattern("1", ["1", "2"]))
    })
    it("should not grant write permission for a reader role to 1", () => {
      const writePatterns = getAuthorizedPatterns(user, config, true)
      expect(writePatterns).not.toContainEqual(
        getASNPrefixPattern("1", ["1", "2"]),
      )
    })
    it("should not grant any permission for a reader role to admin-only folder", () => {
      const readPatterns = getAuthorizedPatterns(user, config, false)
      const writePatterns = getAuthorizedPatterns(user, config, true)
      expect(readPatterns).not.toContainEqual(getASNPrefixPattern("2", ["1"]))
      expect(writePatterns).not.toContainEqual(getASNPrefixPattern("2", ["1"]))
    })
  })
  describe("writer role", () => {
    const user = { roles: ["writer"] }
    it("should grant read and write permission for a writer role to 1", () => {
      const readPatterns = getAuthorizedPatterns(user, config, false)
      const writePatterns = getAuthorizedPatterns(user, config, true)
      expect(readPatterns).toContainEqual(getASNPrefixPattern("1", ["1", "2"]))
      expect(writePatterns).toContainEqual(getASNPrefixPattern("1", ["1", "2"]))
    })
    it("should not grant any permission for a writer role to admin-only folder", () => {
      const readPatterns = getAuthorizedPatterns(user, config, false)
      const writePatterns = getAuthorizedPatterns(user, config, true)
      expect(readPatterns).not.toContainEqual(getASNPrefixPattern("2", ["1"]))
      expect(writePatterns).not.toContainEqual(getASNPrefixPattern("2", ["1"]))
    })
  })
  describe("admin role", () => {
    const user = { roles: ["admin"] }
    it("should grant read and write permission for an admin role", () => {
      const readPatterns = getAuthorizedPatterns(user, config, false)
      const writePatterns = getAuthorizedPatterns(user, config, true)
      expect(readPatterns).toContainEqual(getASNPrefixPattern("2", ["1"]))
      expect(writePatterns).toContainEqual(getASNPrefixPattern("2", ["1"]))
    })
    it("should not grant any permission for an admin role to non-admin folder", () => {
      const readPatterns = getAuthorizedPatterns(user, config, false)
      const writePatterns = getAuthorizedPatterns(user, config, true)
      expect(readPatterns).not.toContainEqual(
        getASNPrefixPattern("1", ["1", "2"]),
      )
      expect(writePatterns).not.toContainEqual(
        getASNPrefixPattern("1", ["1", "2"]),
      )
    })
  })
})
