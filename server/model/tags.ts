import { z } from "@zod/zod"
import type { Database } from "@db/mongo"
import { getDB } from "../db/getDB.ts"
import { getPermissionQuery } from "../auth/getPermissionQuery.ts"
import { ARCHIVED_DOCUMENTS_COLLECTION } from "./collections.ts"
import type { User } from "./user.ts"
import type { Config } from "../getConfig.ts"
import type { AsyncResult, Result } from "../result.ts"

export type Tag = string

/**
 * Fetches a list of tags that are visible to the user from the currently archived documents.
 *
 * Note taht tags are not stored separately in the database, but "visible tags" are defined as
 * the union of all tags in the archived documents that the user has permission to see and the
 * public tags from the configuration.
 * @param user the user for whom the tags are visible
 * @param config the application configuration
 * @param db the database to query
 * @returns a list of tags that are visible to the user
 */
export async function getVisibleTags(
  user: User,
  config: Config,
  db?: Database,
): AsyncResult<Tag[], Error> {
  if (!db) {
    const [newDatabase, getDBError] = await getDB()
    if (getDBError) {
      return [null, getDBError]
    }
    db = newDatabase
  }

  return db.collection(ARCHIVED_DOCUMENTS_COLLECTION).distinct("tags", {
    ...getPermissionQuery(user, config),
  })
    .then((tags) => z.string().array().parse(tags)) // Validate
    .then((tags) => [...tags, ...config.publicTags]) // Add public tags
    .catch((error) => [null, error]) // Convert to AsyncResult
    .then((result) => [result, null])
}

/**
 * Zo schema for a tag string.
 */
export const tagSchema = z.string()
  .min(1)
  .max(512)
  .regex(/^[^,]+$/)
  .transform((value) => value.trim())

/**
 * Parses a tag string, trimming whitespace.
 * @param tag the tag to parse
 * @returns a properly formatted tag or an error if the tag is invalid
 */
export function parseTag(tag: unknown): Result<Tag, Error> {
  const result = tagSchema.safeParse(tag)
  if (!result.success) {
    return [null, new Error(result.error.message, { cause: tag })]
  }
  return [result.data, null]
}

/**
 * Parses any input that can be interpreted as a list of tags.
 *
 * If the input is a string, it is split by commas and whitespace, and the resulting tags are trimmed.
 * Otherwise, the input is expected to be an array of strings.
 *
 * See {@link parseTag} for the tag validation rules.
 * @param input the list of tags to parse
 * @returns a list of tags or an error if the input is invalid
 */
export function parseTags(input: unknown): Result<Tag[], Error> {
  if (typeof input === "string") {
    // Tag string => comma-separated tags
    input = input.split(",")
  }

  // Empty string means no tags
  if (
    Array.isArray(input) &&
    input.length === 1 && // input.split(",") returns [""] for empty string
    input[0].toString().trim() === ""
  ) {
    return [[], null]
  }

  const result = z.array(tagSchema).safeParse(input)
  if (!result.success) {
    return [null, new Error(result.error.message, { cause: input })]
  }
  return [result.data, null]
}

/**
 * Creates a MongoDB query object to match documents with all of the given tags.
 * @param tags tags to query
 * @returns a MongoDB query object that matches documents with all of the given tags
 */
export function queryAll(tags: Tag[]): Record<string, unknown> {
  return {
    tags: {
      $all: tags,
    },
  }
}
