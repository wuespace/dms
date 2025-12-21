/**
 * A React component that highlights query terms in the given content.
 * Props:
 * - content: The text content to display.
 * - query: The search query string containing terms to highlight.
 * - truncate: Whether to truncate non-matching parts of the content.
 * Returns a span element with highlighted terms wrapped in <mark> tags.
 *
 * Truncation keeps a buffer of words around non-matching parts.
 */
export function ContentPreview(
  { content, query, truncate }: {
    content: string
    query?: string
    truncate?: boolean
  },
) {
  if (!query) {
    return <span>{truncate ? removeMiddle(content, 20) : content}</span>
  }
  const queryTerms = query.split(" ").filter((term) => term.length > 0)
  const regex = new RegExp(
    `(${
      queryTerms.map(/* regex escape */ (s) =>
        s.replace(/[.*+?^${}()|[\]\\]/gi, "\\$&")
      ).join("|")
    })`,
    "gi",
  )
  const parts = content.split(regex)

  if (parts.length === 1) {
    return <span>{truncate ? removeMiddle(content, 20) : content}</span>
  }

  return (
    <span>
      {parts.map((part, index) =>
        regex.test(part)
          ? <mark key={index}>{part}</mark>
          : <span key={index}>{truncate ? removeMiddle(part, 4) : part}</span>
      )}
    </span>
  )
}

/**
 * Truncates the middle of the text, keeping a buffer of words at the start and end.
 */
function removeMiddle(text: string, bufferWords: number): string {
  const words = text.split(" ")
  if (words.length <= bufferWords * 2) {
    return text
  }
  const start = words.slice(0, bufferWords).join(" ")
  const end = words.slice(-bufferWords).join(" ")
  return `${start} […] ${end}`
}
