import { monotonicUlid } from "@std/ulid/monotonic-ulid"
import { AsyncResult } from "../result.ts"
import { modifyFilePath } from "./modifyFilePath.ts"

/**
 * Runs an OCR software on the PDF
 * @param src - path to the PDF file
 * @returns path to the created PDF with the OCR data
 */
export async function ocrPDF(
  src = "sample.pdf",
): Promise<AsyncResult<string, OcrError>> {
  const dest = modifyFilePath(src, monotonicUlid(), "pdf")

  const cmd = new Deno.Command("ocrmypdf", {
    args: [
      "-l",
      "deu+eng",
      "--deskew",
      // "--output-type",
      // "pdf", // Runs into infinite https://github.com/ocrmypdf/OCRmyPDF/issues/1321
      "--rotate-pages",
      "--skip-text",
      // "--invalidate-digital-signatures", // TODO: Add back in once the Debian version supports it
      src,
      dest,
    ],
  })
  const res = await cmd.output()
  if (!res.success) {
    const td = new TextDecoder()
    const err = td.decode(res.stderr)
    return [null, new OcrError("Failed to OCR PDF. Details:\n" + err)]
  }
  return [dest, null]
}

/**
 * An error that occurred within the OCR program.
 */
export class OcrError extends Error {
  readonly type = "OcrError"
}
