import { Hono } from "@hono/hono"
import { LocalizedHttpException, lt, t } from "@wuespace/honolate"
import { ArchivedDocumentModel } from "../../model/documents/ArchivedDocument.ts"
import { Tag } from "../../model/tags.ts"
import { ASNField } from "../components/ASNField.tsx"
import { DocumentCard } from "../components/DocumentCard.tsx"
import { DocumentGrid } from "../components/DocumentGrid.tsx"
import { TagsInput } from "../components/tags-input.tsx"
import { SEARCH_FORM_NAME } from "../layouts/base.tsx"
import { withConfig } from "../middleware/with-config.ts"
import { withDB } from "../middleware/with-db.ts"
import { withUser } from "../middleware/with-user.tsx"
import { searchQueryParamsValidator } from "../validators/search-query-params.ts"
import { DocumentGridLayoutSelector } from "../components/DocumentGridLayoutSelector.tsx"

export const searchRouter = new Hono()
  .use(withConfig, withDB, withUser)

searchRouter
  .get("/", searchQueryParamsValidator, async (c) => {
    const archivedDocsRepo = new ArchivedDocumentModel(
      c.var.db,
      c.var.user,
      c.var.config,
    )

    const additionalQueries = {
      ...getASNQuery(c.req.valid("query").asn),
      ...getTitleQuery(c.req.valid("query").title),
      ...getTagsQuery(c.req.valid("query").tags),
    }

    const query = c.req.query("q") ?? ""
    const [results, searchError] = query.length
      ? await archivedDocsRepo.search(query, additionalQueries)
      : await archivedDocsRepo.get(additionalQueries)

    if (searchError) {
      throw new LocalizedHttpException({
        status: 500,
        technicalMessage: "Failed to search archived documents",
        localizedTitle: lt`Failed to search archived documents`,
        localizedMessage:
          lt`An error occurred while searching the archived documents. Please try again later or contact support.`,
        cause: searchError,
      })
    }

    return c.render(
      <div class="section">
        {query && (
          <title>{t`Search Results for "${query}" - WüSpace DMS`}</title>
        )}
        <title>{t`Search - WüSpace DMS`}</title>
        <h1 class="title is-2">{t`Search Results`}</h1>
        <p class="subtitle is-4">
          {t`Showing search results for: ${<strong>{query}</strong>}`}
        </p>
        <div>
          <ASNField
            value={c.req.valid("query").asn}
            form={SEARCH_FORM_NAME}
          />
        </div>
        <div class="field">
          <label class="label" htmlFor="title">{t`Title`}</label>
          <input
            class="input"
            type="text"
            id="title"
            name="title"
            placeholder={t`Title`}
            value={c.req.valid("query").title}
            form={SEARCH_FORM_NAME}
          />
        </div>
        <div class="field">
          <label class="label" htmlFor="tags">{t`Tags`}</label>
          <TagsInput
            value={c.req.valid("query").tags}
            name="tags"
            form={SEARCH_FORM_NAME}
          />
        </div>
        <div class="control my-4">
          <button
            class="button is-link"
            type="submit"
            form={SEARCH_FORM_NAME}
          >
            {t`Search`}
          </button>
          <DocumentGridLayoutSelector />
        </div>
        <DocumentGrid>
          {results.map((doc) => (
            <DocumentCard
              doc={doc}
              asnPrefix={c.var.config.asnPrefix}
              href={`/archived/${doc.asn}`}
              queryHighlight={query}
              interactiveTags
            />
          ))}
        </DocumentGrid>
      </div>,
    )
  })

/**
 * Generates a MongoDB query object for ASN search.
 */
function getASNQuery(asn?: string) {
  if (!asn || !asn.length) {
    return {}
  }

  return { asn: { $regex: `^${asn}` } }
}

/**
 * Generates a MongoDB query object for title search.
 */
function getTitleQuery(title?: string) {
  if (!title || !title.length) {
    return {}
  }

  return { title: { $regex: `${title}` } }
}

/**
 * Generates a MongoDB query object for tags search.
 */
function getTagsQuery(tags?: Tag[]) {
  if (!tags || tags.length === 0) {
    return {}
  }

  return { tags: { $all: tags } }
}
