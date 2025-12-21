import { getConfig } from "../getConfig.ts"
import { Result } from "../result.ts"

/**
 * Get the ASN number from the barcodes extracted from the document.
 * @param codes the barcodes extracted from the document
 * @returns the ASN number extracted from the barcodes
 */
export function getASNFromCodes(
  codes: string[],
): Result<string, Error> {
  const [config, error] = getConfig()
  if (error) {
    return [
      null,
      new Error(
        "Couldn't parse ASN barcode because the config couldn't be loaded.",
        { cause: error },
      ),
    ]
  }
  const { asnPrefix } = config
  for (const code of codes) {
    if (code.startsWith(asnPrefix)) {
      return [code.slice(asnPrefix.length), null]
    }
  }
  return ["", null]
}
