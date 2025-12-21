import { t } from "@wuespace/honolate"
import { useRequestContext } from "@hono/hono/jsx-renderer"

/**
 * A form field for entering an ASN (Autonomous System Number).
 * Includes a label, an input field prefixed with a static part from the configuration,
 * and an optional link to generate a new ASN.
 *
 * Props:
 * - value: The current value of the ASN input field.
 * - required: Whether the field is required.
 * - form: The form attribute to associate the input with a specific form.
 * - asnGeneratorUrl: An optional URL to generate a new ASN.
 * Any `data-` attributes can also be passed and will be applied to the input element.
 */
export function ASNField(
  { value, required, form, asnGeneratorUrl, ...dataProps }: {
    value?: string
    required?: boolean
    form?: string
    asnGeneratorUrl?: string
    [key: `data-${string}`]: unknown
  },
) {
  return (
    <div class="field">
      <label class="label" for="asn">
        {required ? t`Document Number *` : t`Document Number`}{" "}
        <GenerateASNLink asnGeneratorUrl={asnGeneratorUrl} />
      </label>
      <div className="field has-addons">
        <p class="control">
          <a class="button is-static">
            {useRequestContext().var.config?.asnPrefix}
          </a>
        </p>
        <p class="control is-expanded">
          <input
            name="asn"
            id="asn"
            class="input is-fullwidth"
            type="number"
            step="1"
            placeholder="XX XXX"
            value={value}
            required={required}
            form={form}
            {...dataProps}
          />
        </p>
      </div>
    </div>
  )
}

function GenerateASNLink({ asnGeneratorUrl }: { asnGeneratorUrl?: string }) {
  if (!asnGeneratorUrl) {
    return null
  }
  return (
    <a
      href={asnGeneratorUrl}
      target="_blank"
      rel="noopener noreferrer"
    >
      – Generate a new document number
    </a>
  )
}
