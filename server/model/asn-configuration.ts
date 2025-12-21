import { Config } from "../getConfig.ts"

/**
 * Returns a flattened array of register entries derived from the provided configuration.
 *
 * Traverses each folder (folder) in `config.folders` and, for every child entry in the folder's
 * `registers` object, produces a record that combines the folder prefix with the child key and preserves
 * references to the original folder and child register description.
 *
 * @param config - Configuration object containing a `folders` array. Each folder (folder) is expected
 *                 to have a `prefix: string` and `registers: Record<string, any>` (child value represents the
 *                 register description).
 *
 * @returns An array of objects with the following shape:
 * - prefix: string — concatenation of the folder `prefix` and the child key (`${folder.prefix}${childKey}`)
 * - register: any — the original child value from `folder.registers` (register description)
 * - folderPrefix: string — the folder's `prefix`
 * - registerPrefix: string — the child key (suffix used to build `prefix`)
 * - folder: any — the original folder object from `config.folders`
 *
 * @remarks
 * - The returned array preserves the iteration order of `config.folders` and the enumeration order of each
 *   folder's `registers`.
 */
export function getAllRegisters(config: Config) {
  const result = []

  for (const folder of config.folders) {
    const { prefix, registers } = folder
    for (
      const [childPrefix, registerDescription] of Object.entries(registers)
    ) {
      result.push({
        prefix: `${prefix}${childPrefix}`,
        register: registerDescription,
        folderPrefix: prefix,
        registerPrefix: childPrefix,
        folder,
      })
    }
  }

  return result
}

/**
 * Retrieves register metadata that matches a given ASN.
 *
 * Searches the registers provided by the given configuration and returns the first register
 * whose `prefix` (interpreted as a regular expression anchored to the entire string) matches
 * the supplied `asn`.
 *
 * @param asn - The ASN to match. The register `prefix` is treated as a regex pattern and is tested
 *              against the entire ASN (anchors `^` and `$` are applied). Matching is case-sensitive.
 * @param config - Configuration used to obtain the list of registers (via `getAllRegisters`).
 *
 * @returns An object with the shape `{ prefix, register, folderPrefix, registerPrefix, folder }`
 *          for the first matching register, or `undefined` if no match is found.
 *
 * @remarks
 * - The function stops at the first successful match.
 * - Because `prefix` values are interpreted as regular expressions, ensure they are safe and
 *   properly escaped if they originate from untrusted input.
 */
export function getRegisterInformation(asn: string, config: Config) {
  const registers = getAllRegisters(config)

  for (
    const { prefix, register, folderPrefix, registerPrefix, folder }
      of registers
  ) {
    if (new RegExp(`^${prefix}`).test(asn)) {
      return { prefix, register, folderPrefix, registerPrefix, folder }
    }
  }
}

/**
 * Returns the first folder object from the provided configuration whose prefix matches the start of the given ASN.
 *
 * The function iterates through `config.folders`,
 * testing each folder's `prefix` against `asn` using a regular expression anchored at the beginning (`new RegExp(\`^${prefix}\`)`).
 * It returns the first folder that matches, or `undefined` if none match.
 *
 * @param asn - The ASN string to test (e.g. "12345"). Matching is performed against the start of this string.
 * @param config - A configuration object that contains a `folders` array. Each folder is expected to have a `prefix` string property.
 * @returns The first matching folder object, or `undefined` if no folder prefix matches `asn`.
 *
 * @remarks
 * - Prefixes are interpolated directly into a `RegExp`.
 *   If a prefix contains regular expression metacharacters, matching behavior may be unexpected.
 *   Escape prefixes if you require literal matching.
 * - Matching stops at the first match found; order of `config.folders` determines precedence.
 * - If `config.folders` is empty or not provided, the function will return `undefined`.
 *
 * @example
 * // Given config.folders = [{ prefix: "1", ... }, { prefix: "2" }]
 * getFolderInformation("123", config) // -> returns the folder with prefix "1"
 */
export function getFolderInformation(asn: string, config: Config) {
  for (const folder of config.folders) {
    const { prefix } = folder
    if (new RegExp(`^${prefix}`).test(asn)) {
      return folder
    }
  }
}
