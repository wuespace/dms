import { AsyncResult } from "../result.ts"
import { monotonicUlid } from "@std/ulid"
import { extname, resolve } from "node:path"
import { copyFile, mkdir } from "node:fs/promises"

/**
 * Copies a file to a temporary directory.
 * @param originalPath the path to the file to copy
 * @returns the path to the file in the temp directory
 */
export async function copyToTempDir(
  originalPath: string,
): AsyncResult<string, Error> {
  const name = monotonicUlid() + extname(originalPath)
  const tempDir = resolve("data", "temp", monotonicUlid())
  await mkdir(tempDir, { recursive: true })
  const newPath = resolve(tempDir, name)
  await copyFile(originalPath, newPath)
  return [newPath, null]
}
