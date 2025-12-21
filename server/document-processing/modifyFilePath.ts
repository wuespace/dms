import { dirname, extname, join } from "node:path"

/**
 * Modifies a file path by changing its name and optionally its extension.
 * @param originalFilePath the original file path
 * @param newName the new name for the file (without extension)
 * @param newExtension the new extension for the file (without dot), optional
 * @returns the modified file path
 */
export function modifyFilePath(
  originalFilePath: string,
  newName: string,
  newExtension?: string,
): string {
  const extension = newExtension ?? extname(originalFilePath)
  const name = newName + "." + extension
  const directory = dirname(originalFilePath)

  return join(directory, name)
}
