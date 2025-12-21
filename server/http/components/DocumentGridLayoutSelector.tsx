import { useRequestContext } from "@hono/hono/jsx-renderer"
import { getCookie, setCookie } from "@hono/hono/cookie"
import { PreviousFields } from "./PreviousFields.tsx"
import { t } from "@wuespace/honolate"

/**
 * A selector form for choosing the document grid layout.
 * Renders a dropdown with layout options: Full, Small, Mini.
 * On selection change, the form is submitted to update the layout preference.
 * The selected layout is stored in a cookie for persistence.
 */
export function DocumentGridLayoutSelector() {
  const documentGridLayout = useDocumentGridLayout()
  return (
    <form class="mt-4" method="get">
      <PreviousFields omitFields={["layout"]} />
      <div className="field">
        <div class="select is-link">
          <select
            id="layout"
            name="layout"
            onchange="this.form.submit()"
            aria-label={t`Select document grid layout`}
          >
            <option value="full" selected={documentGridLayout === "full"}>
              {t`Layout: Full`}
            </option>
            <option value="small" selected={documentGridLayout === "small"}>
              {t`Layout: Small`}
            </option>
            <option value="mini" selected={documentGridLayout === "mini"}>
              {t`Layout: Mini`}
            </option>
          </select>
        </div>
      </div>
    </form>
  )
}

/**
 * The possible layout options.
 */
const layoutOptions = ["full", "small", "mini"] as const
/**
 * The possible document grid layout options.
 */
type DocumentGridLayout = (typeof layoutOptions)[number]

/**
 * A hook to get and set the user's document grid layout preference.
 */
export function useDocumentGridLayout(): DocumentGridLayout {
  const ctx = useRequestContext()

  // Get inputs
  const newLayout = ctx.req.query("layout")
  const oldLayout = getCookie(ctx, "document_grid_layout")
  const inputLayout = newLayout ?? oldLayout ?? "full"

  // Validate
  const finalLayout = layoutOptions.includes(inputLayout as DocumentGridLayout)
    ? (inputLayout as DocumentGridLayout)
    : "full"

  // Save and return
  if (newLayout && newLayout !== oldLayout) {
    setCookie(ctx, "document_grid_layout", finalLayout, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })
  }
  return finalLayout
}
