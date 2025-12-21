import { getLogger } from "../log.ts"

const DATE_FORMATS = [
  `XX.XX.XXXX`,
  `XX.XX.XX`,
  `XXXX-XX-XX`,
  `XX/XX/XXXX`,
  `XXXX/XX/XX`,
]

// build regexp
const format = new RegExp(
  `(${DATE_FORMATS.join(`|`)})`.replaceAll(`X`, `\\d`).replaceAll(`.`, `\\.`)
    .replaceAll(`/`, `\\/`),
)

export function extractDateFromContent(content: string): Date | null {
  const logger = getLogger("document-processing/extractDateFromContent")
  const match = content.match(format)
  if (match) {
    const dateStr = preformatDateString(match[0])
    logger.withContext({ dateStr })
    logger.debug(`Found date in content.`)

    const date = new Date(dateStr)
    logger.withContext({ date })
    if (isNaN(date.getTime())) {
      logger.warn(`Failed to parse date`)
      return null
    }
    logger.debug(`Parsed date.`)

    return date
  }
  logger.debug(`No date found in content`)
  return null
}

/**
 * Reformats a date string to the format `mm/dd/yyyy`
 * @param input Input date string
 * @returns date string in the format `mm/dd/yyyy`
 */
function preformatDateString(input: string): string {
  // German date format
  const germanMatch = input.match(/(\d{1,2})\.(\d{1,2})\.(\d{2,4})/)
  if (germanMatch) {
    return `${germanMatch[2]}/${germanMatch[1]}/${germanMatch[3]}`
  }

  // ISO date format
  const isoMatch = input.match(/(\d{2,4})-(\d{2})-(\d{2})/)
  if (isoMatch) {
    return `${isoMatch[2]}/${isoMatch[3]}/${isoMatch[1]}`
  }

  return input
}
