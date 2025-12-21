import { t } from "@wuespace/honolate"
import { ASNField } from "./ASNField.tsx"
import { ReadOnlyValue } from "./readonly-value.tsx"
import { TagsInput } from "./tags-input.tsx"
import { useRequestContext } from "@hono/hono/jsx-renderer"
import { DateDisplay } from "./DateDisplay.tsx"

/**
 * A form for displaying and editing document metadata.
 * If an `action` URL is provided, the form is editable and submits to that URL.
 * Otherwise, it displays the metadata in a read-only format.
 *
 * Props:
 * - title: The document title.
 * - content: The document content.
 * - date: The document date in YYYY-MM-DD format.
 * - asn: The document ASN (Document Number).
 * - tags: An array of tags associated with the document.
 * - action: Optional URL to submit the form to. If not provided, the form is read-only.
 * - asnGeneratorUrl: Optional URL to generate a new ASN.
 * @returns A form element for editing or displaying document metadata.
 */
export function DocumentMetadataForm({
  title,
  content,
  date,
  asn,
  tags,
  action,
  asnGeneratorUrl,
}: DocumentMetadataFormProps) {
  if (!action) {
    return (
      <div className="block">
        <ReadOnlyValue label={t`Title`}>
          {title}
        </ReadOnlyValue>
        <ReadOnlyValue label={t`Date`}>
          <DateDisplay date={new Date(date)} />
        </ReadOnlyValue>
        <ReadOnlyValue label={useRequestContext().var.config?.asnPrefix}>
          {useRequestContext().var.config?.asnPrefix}&nbsp;{asn}
        </ReadOnlyValue>
        <ReadOnlyValue label={t`Tags`} tags>
          {tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
        </ReadOnlyValue>
        <div className="field">
          <label>{t`Content`}</label>
          <textarea readonly class="textarea" rows={10}>
            {content}
          </textarea>
        </div>
      </div>
    )
  }

  return (
    <form
      method="post"
      action={action}
      className="block"
      data-validate
    >
      <input
        // This hidden input triggers the confirmation dialog for archiving
        // through the data-validate attribute on the form and the async-form-validation module
        type="hidden"
        data-validator="trigger-confirmation"
        value={t`Are you sure you want to archive the document with the selected metadata? Archived documents cannot be modified later.`}
      />
      <div className="field">
        <label class="label" for="title">{t`Title *`}</label>
        <input
          name="title"
          class="input"
          type="text"
          placeholder={t`Title`}
          value={title}
          required
          autofocus
        />
      </div>
      <div className="field">
        <label class="label" for="date">{t`Date *`}</label>
        <input
          name="date"
          class="input"
          type="date"
          value={date}
          required
        />
      </div>
      <ASNField
        value={asn}
        required
        asnGeneratorUrl={asnGeneratorUrl}
        data-validator="archive-asn"
      />
      <div className="field">
        <label class="label" for="tags">{t`Tags`}</label>
        <TagsInput
          name="tags"
          value={tags}
          data-validator="archive-tags"
        />
      </div>
      <div className="field">
        <label class="label" for="content">{t`Content`}</label>
        <textarea name="content" class="textarea" rows={10}>
          {content}
        </textarea>
      </div>
      <div class="field is-grouped is-grouped-right">
        <p class="control">
          <button class="button is-primary" type="submit">
            {t`Save`}
          </button>
        </p>
      </div>
    </form>
  )
}

export interface DocumentMetadataFormProps {
  title: string
  content: string
  date: string
  asn: string
  tags: string[]
  action?: string
  asnGeneratorUrl?: string
}
