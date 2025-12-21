import { css, cx } from "@hono/hono/css"

/**
 * A file upload component allowing multiple file selection.
 * Uses frontend JS to progressively enhance the file input.
 */
export function FileUpload() {
  return (
    <div
      className={cx(
        "field",
        css`
          min-height: 80px;
        `,
      )}
    >
      <input type="file" multiple class="file-upload" />
    </div>
  )
}
