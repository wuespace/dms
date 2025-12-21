import { useLocale } from "@wuespace/honolate"

/**
 * A component to display a date in a localized format.
 * Props:
 * - date: The Date object to display.
 * - short: Optional boolean to use a shorter date format (MM/DD/YYYY).
 * Returns a <time> element with the formatted date.
 * The date is formatted according to the user's locale.
 * If `short` is true, the date is displayed in a numeric format.
 * Otherwise, it uses a long month name format.
 */
export function DateDisplay({ date, short }: { date: Date; short?: boolean }) {
  return (
    <time dateTime={date.toISOString()}>
      {date.toLocaleDateString(useLocale(), {
        year: "numeric",
        month: short ? "2-digit" : "long",
        day: short ? "2-digit" : "numeric",
      })}
    </time>
  )
}
