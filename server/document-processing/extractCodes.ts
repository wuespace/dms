import { AsyncResult } from "../result.ts"

/**
 * Extracts QR- and barcodes from an image file
 * @param imagePath the path to an image file (potentially) containing codes
 * @returns array of codes extracted from the image
 */
export async function extractCodes(
  imagePath: string,
): AsyncResult<string[], ZBarError> {
  const imageCodeExtractorProcess = new Deno.Command("zbarimg", {
    args: [
      "--quiet", // Leave out process information
      "--raw", // Only output the decoded data
      imagePath,
    ],
    stdout: "piped",
  })

  const executionResult = await imageCodeExtractorProcess.output()
  if (executionResult.code === 4) {
    // zbarimg returns 4 if no codes were found
    return [[], null]
  }
  if (!executionResult.success) {
    return [
      null,
      new ZBarError(
        "Failed to extract text from PDF. zbarimg failed with Status Code: " +
          executionResult.code,
      ),
    ]
  }

  const textDecoder = new TextDecoder()
  const extractedText = textDecoder.decode(executionResult.stdout)
  const extractedCodes = extractedText.split("\n")
    .map((code) => code.trim())
    .filter((code) => code.length > 0)
  return [extractedCodes, null]
}

export class ZBarError extends Error {
  public readonly type = "ZBarError"
}
