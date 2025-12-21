import { resolve } from "@std/path"
import { exists } from "@std/fs"

export function getDataDirectory(...segments: string[]): string {
  return resolve("data", ...segments)
}

export function getDocumentDirectory(
  documentId: string,
  file?: string,
): string {
  if (file) {
    return resolve(getDocumentDirectory(documentId), file)
  }
  return resolve(getDataDirectory("documents"), documentId)
}

export function getTempDirectory(documentId: string, file?: string): string {
  if (file) {
    return resolve(getTempDirectory(documentId), file)
  }
  return resolve(getDataDirectory("temp"), documentId)
}

export async function ensureDoesntExist(path: string) {
  // Check if the directory exists
  if (await exists(path)) {
    // Remove the directory
    await Deno.remove(path, { recursive: true })
  }
}
