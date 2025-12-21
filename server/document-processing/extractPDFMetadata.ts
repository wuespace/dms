import { z } from "@zod/zod"
import { AsyncResult, wrapAsync } from "../result.ts"
import { GotenbergError } from "./GotenbergError.ts"
import { getLogger } from "../log.ts"

const FORM_FILE_NAME = "file.pdf"

export interface ExtractedPDFMetadata {
  title: string
  tags: string[]
  date: Date
}

/**
 * Based on https://exiftool.org/TagNames/XMP.html#pdf.
 */
const GotenbergMetadataResponseSchema = z.object({
  [FORM_FILE_NAME]: z.object({
    CreationDate: z.coerce.date().optional(),
    ModDate: z.coerce.date().optional(),
    Title: z.string().optional(),
    Subject: z.string().optional(),
    Keywords: z.coerce.string().array().or(z.string()).optional(),
  }),
})

/**
 * Converts a given file to PDF.
 * @param src the source file
 * @returns the path to the converted file
 */
export async function extractPDFMetadata(
  src: string,
): AsyncResult<ExtractedPDFMetadata, GotenbergError> {
  const logger = getLogger("document-processing/extractPDFMetadata")
    .withContext({
      src,
    })
  const fd = new FormData()
  fd.append("files", new Blob([await Deno.readFile(src)]), FORM_FILE_NAME)

  const res = await fetch(
    "http://gotenberg:3000/forms/pdfengines/metadata/read",
    {
      method: "POST",
      body: fd,
    },
  )

  if (!res.ok) {
    const details = await res.text()
    const status = res.statusText
    logger.withMetadata({ status, details }).error(
      "Gotenberg API responded with an error.",
    )
    return [
      null,
      new GotenbergError(
        `Failed to extract PDF metadata with Gotenberg.\n` +
          `Gotenberg responded with "${status}". Additional Details:\n` +
          details,
      ),
    ]
  }

  const [data, jsonError] = await wrapAsync(res.json())
  logger.withContext({
    gotenbergResponse: data,
  })
  if (jsonError) {
    logger.withError(jsonError).error(
      "Couldn't parse Gotenberg response as JSON.",
    )
    return [
      null,
      new GotenbergError("Couldn't parse Gotenberg response.", {
        cause: jsonError,
      }),
    ]
  }
  const result = GotenbergMetadataResponseSchema.safeParse(data)
  if (!result.success) {
    logger.withError(result.error).error(
      "Gotenberg response didn't match schema.",
    )
    return [
      null,
      new GotenbergError("Gotenberg response didn't match schema.", {
        cause: result.error,
      }),
    ]
  }
  logger.withContext({ gotenbergParsedResponse: result.data })
  logger.debug("Successfully extracted PDF metadata from Gotenberg.")

  const { CreationDate, ModDate, Title, Subject, Keywords } =
    result.data[FORM_FILE_NAME]

  return [{
    title: Title ?? Subject ?? "",
    tags: Array.isArray(Keywords) ? Keywords : Keywords ? [Keywords] : [],
    date: CreationDate ?? ModDate ?? new Date(),
  }, null]
}
