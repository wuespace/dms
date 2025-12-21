import { useRequestContext } from "@hono/hono/jsx-renderer"

/**
 * Appends all previous query fields as hidden inputs.
 *
 * @param omitFields Fields to omit from the previous fields.
 * @returns Hidden input elements for previous query fields.
 */
export function PreviousFields({
  omitFields = [],
}: {
  omitFields?: string[]
}) {
  const previousFields = Object.entries(useRequestContext().req.queries())
    .filter(
      ([field]) => !omitFields.includes(field),
    )
  return (
    <>
      {previousFields.flatMap(([key, values], index) => (
        values.map((value, index2) => (
          <input
            type="hidden"
            key={`${index}-${index2}`}
            name={key}
            value={value}
          />
        ))
      ))}
    </>
  )
}
