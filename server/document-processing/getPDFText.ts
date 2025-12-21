import { AsyncResult } from "../result.ts"

/**
 * Retrieves the text data from a PDF file
 * @param path the path to the PDF file
 * @returns the text contained in the PDF file
 */
export async function getPDFText(
  path: string = "sample.pdf",
): AsyncResult<string, PdfToTextError> {
  // throw if pdftotext is not installed
  const pdfToTextProcess = new Deno.Command("pdftotext", {
    args: ["-enc", "UTF-8", "-q", path, "-"],
    stdout: "piped",
  })

  const textDecoder = new TextDecoder()
  const executionResult = await pdfToTextProcess.output()
  if (!executionResult.success) {
    const err = textDecoder.decode(executionResult.stderr)
    return [
      null,
      new PdfToTextError("Failed to extract text from PDF. Details:\n" + err),
    ]
  }

  const text = textDecoder.decode(executionResult.stdout)
  return [text, null]
}

/**
 * An error that occurred while trying to extract the text from a PDF
 */
export class PdfToTextError extends Error {
  public readonly type = "PdfToTextError"
}
