import { useRequestContext } from "@hono/hono/jsx-renderer"
import { parseTag, parseTags } from "../../model/tags.ts"
import { cx } from "@hono/hono/css"
import { t } from "@wuespace/honolate"

/**
 * Renders a toggle button for a single filter tag that updates the request's "tag" query parameter when submitted.
 *
 * The component:
 * - Parses the provided `tag` and the current request `tags` query parameter.
 * - Determines whether the provided tag is currently active.
 * - Builds a new comma-separated `tags` value that either removes the tag (if active) or adds it (if inactive).
 * - Renders a <button type="submit"> with name="tags" and value set to the new comma-separated tag list (or an empty string when no tags remain).
 * - Applies base CSS classes "tag filter_toggle_tag" and adds "is-primary filter_toggle_tag--active" when the tag is active.
 *
 * @param props.tag - The tag string to display and toggle.
 * @returns JSX.Element A submit button that toggles the presence of `tag` in the request's "tags" query parameter.
 * @throws {Error} If parsing of the provided tag or the request "tags" query parameter fails.
 */
export function FilterToggleTag(
  { tag, interactive = false }: { tag: string; interactive?: boolean },
) {
  if (!interactive) {
    return (
      <span class={cx("tag filter_toggle_tag filter_toggle_tag--static")}>
        {tag}
      </span>
    )
  }
  const [currentTag, currentTagErr] = parseTag(tag)
  const [currentTags, currentTagsErr] = parseTags(
    useRequestContext().req.query("tags")?.split(",") ?? [],
  )
  if (currentTagErr || currentTagsErr) {
    throw new Error("Invalid tag in request query parameters")
  }

  const isActive = currentTags.includes(currentTag)

  const newValue = isActive
    ? currentTags.filter((t) => t !== currentTag)
    : [...currentTags, currentTag]

  const newValueParam = newValue.length > 0 ? newValue.join(",") : null

  return (
    <button
      type="submit"
      role="switch"
      aria-checked={isActive}
      aria-label={isActive
        ? t`Remove tag filter ${currentTag}`
        : t`Add tag filter ${currentTag}`}
      name="tags"
      value={newValueParam ?? ""}
      class={cx(
        "tag filter_toggle_tag",
        isActive && "is-primary filter_toggle_tag--active",
      )}
    >
      {currentTag}
    </button>
  )
}
