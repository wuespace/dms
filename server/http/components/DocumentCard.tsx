import { cx } from "@hono/hono/css"
import { html } from "@hono/hono/html"
import { t } from "@wuespace/honolate"
import { ArchivedDocument } from "../../model/documents/ArchivedDocument.ts"
import { InboxDocument } from "../../model/documents/InboxDocument.ts"
import { ContentPreview } from "./ContentPreview.tsx"
import { DateDisplay } from "./DateDisplay.tsx"
import { FilterToggleTag } from "./FilterToggleTag.tsx"
import { PreviousFields } from "./PreviousFields.tsx"

/**
 * A card component to display a document (inbox or archived).
 *
 * Props:
 * - doc: The document to display (InboxDocument or ArchivedDocument).
 * - asnPrefix: The prefix to use for the ASN display.
 * - debug: Optional flag to enable debug information.
 * - href: The URL template for the document link, with placeholders `:asn` and `:id`.
 * - queryHighlight: Optional query string to highlight in the content preview.
 * - interactiveTags: Optional flag to make tags interactive (default: false).
 * @return A JSX element representing the document card.
 */
export function DocumentCard(
  { doc, asnPrefix, debug, href, queryHighlight, interactiveTags = false }: {
    doc: InboxDocument | ArchivedDocument
    asnPrefix: string
    debug?: boolean
    href: string
    queryHighlight?: string
    interactiveTags?: boolean
  },
) {
  href = href
    .replace(":asn", "asn" in doc ? doc.asn : doc.suggestedASN)
    .replace(":id", doc.id)

  const hasTags = "tags" in doc && doc.tags.length > 0

  return (
    <a class="box document_card" key={doc.id} href={href}>
      <figure class="image media document_card__media">
        <img
          src={doc.thumbnailPath.substring(4)}
          srcset={`${doc.thumbnailPath.substring(4)} 1x, ` +
            `${doc.retinaThumbnailPath.substring(4)} 2x`}
          alt={"suggestedTitle" in doc ? doc.suggestedTitle : doc.title}
        />
      </figure>
      <h2 class="document_card__title">
        {"suggestedTitle" in doc ? doc.suggestedTitle : doc.title}
      </h2>
      <p class="document_card__asn">
        {asnPrefix} {"suggestedASN" in doc
          ? doc.suggestedASN
          : "asn" in doc
          ? doc.asn
          : "XX XXX"}
      </p>
      <p class="document_card__date document_card__date--long">
        <DateDisplay date={doc.date} />
      </p>
      <p class="document_card__date document_card__date--short">
        <DateDisplay date={doc.date} short />
      </p>
      {html`
        <!-- ${t`Document ID: ${doc.id}`} -->
      `}
      {hasTags &&
        (
          <>
            <form class="document_card__tags tags">
              <PreviousFields omitFields={["tags"]} />
              {doc.tags.map((tag) => (
                <FilterToggleTag
                  key={tag}
                  tag={tag}
                  interactive={interactiveTags}
                />
              ))}
            </form>
          </>
        )}
      <p
        class={cx(
          "content document_card__preview",
        )}
      >
        <ContentPreview
          truncate
          content={doc.content}
          query={queryHighlight}
        />
      </p>
      {debug &&
        html`
          <!-- ${t`Document debug info: ${JSON.stringify(doc)}`} -->
        `}
    </a>
  )
}
