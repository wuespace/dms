import { PropsWithChildren } from "@hono/hono/jsx"
import { cx } from "@hono/hono/css"

export interface ReadOnlyValueProps {
  label?: string
  tags?: boolean
}

/**
 * A component to display a read-only value with an optional label.
 *
 * Props:
 * - label: An optional label to display above the value.
 * - tags: If true, applies tag styling to the value.
 */
export function ReadOnlyValue(
  { children, label, tags }: PropsWithChildren<ReadOnlyValueProps>,
) {
  return (
    <div className="block">
      {label && (
        <p className="subtitle is-6">
          {label}
        </p>
      )}
      <p className={cx("title is-4", tags && "tags are-medium")}>
        {children}
      </p>
    </div>
  )
}
