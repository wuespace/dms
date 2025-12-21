import { css } from "@hono/hono/css"
import type { PropsWithChildren } from "@hono/hono/jsx"

/**
 * A layout component that displays its children alongside a PDF preview.
 */
const grid = css`
  @media screen and (min-width: 768px) {
    display: grid;
    height: 100%;
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr;
    grid-gap: 1rem;

    .section {
      overflow-y: auto;
    }
  }

  @media screen and (min-width: 1200px) {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr;
  }
`

/**
 * Renders a layout with a PDF preview alongside its children.
 *
 * Props:
 * - `pdfSrc`: The source URL of the PDF to preview.
 *
 * Usage:
 * ```tsx
 * <WithPDFPreview pdfSrc="/path/to/document.pdf">
 *   <YourContentHere />
 * </WithPDFPreview>
 * ```
 */
export function WithPDFPreview(
  { children, pdfSrc }: PropsWithChildren<{ pdfSrc: string }>,
) {
  return (
    <div className={grid}>
      <div className="section">
        {children}
      </div>
      <embed
        src={pdfSrc}
        width="100%"
        height="100%"
        type="application/pdf"
        class={css`
          min-height: 480px;
        `}
      />
    </div>
  )
}
