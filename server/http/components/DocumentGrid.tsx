import { cx } from "@hono/hono/css"
import { PropsWithChildren } from "@hono/hono/jsx"
import { t } from "@wuespace/honolate"
import { useDocumentGridLayout } from "./DocumentGridLayoutSelector.tsx"

/**
 * A grid layout for displaying document cards.

 * Props:
 * - children: The document cards to display within the grid.
 * - noDocumentsFoundMessage: Optional custom message to display when no documents are found.
 * If not provided, defaults to "No documents found."
 *
 * The grid layout is determined by the user's selection via {@link import("./DocumentGridLayoutSelector.tsx").DocumentGridLayoutSelector}.
 */
export function DocumentGrid(
  { children, noDocumentsFoundMessage }: PropsWithChildren<
    { noDocumentsFoundMessage?: string }
  >,
) {
  const documentGridLayout = useDocumentGridLayout()
  return (
    <>
      <link rel="stylesheet" href="/static/document-grid.css" />
      <div
        class={cx(
          "document_card_grid",
          !!children && `document_card_grid--${documentGridLayout}`,
        )}
      >
        {children}
        {!children && (
          <p class="document_card_grid__empty notification">
            {noDocumentsFoundMessage ?? t`No documents found.`}
          </p>
        )}
      </div>
    </>
  )
}
