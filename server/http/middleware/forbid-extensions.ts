import { createMiddleware } from "@hono/hono/factory"
import { LocalizedHttpException, lt } from "@wuespace/honolate"

/**
 * Middleware that forbids access to files with certain extensions.
 */
export const forbidExtensions = (extensions: string[]) =>
  createMiddleware((c, next) => {
    extensions = extensions.map(parseExtension)
    if (extensions.some((ext) => c.req.url.includes(ext))) {
      throw new LocalizedHttpException({
        status: 403,
        technicalMessage: "Access to this file type is forbidden.",
        localizedTitle: lt`Access to this file type is forbidden.`,
        localizedMessage:
          lt`You are not allowed to access this file type within this directory.`,
        cause: `Forbidden extensions: ${extensions.join(", ")}`,
      })
    }
    return next()
  })

/**
 * Parses an extension to ensure it starts with a dot and is lowercase.
 * @param extension The file extension to parse.
 * @returns The parsed file extension, formatted in lowercase as `".ext"`.
 */
function parseExtension(extension: string): string {
  extension = extension.toLowerCase()
  if (extension.startsWith(".")) {
    return extension
  }
  return `.${extension}`
}
