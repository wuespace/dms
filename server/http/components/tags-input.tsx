import { cx } from "@hono/hono/css"
import { LocalizedHttpException, lt } from "@wuespace/honolate"
import { parseTags } from "../../model/tags.ts"

/**
 * An input field for tags, where tags are represented as a comma-separated string.
 * @throws LocalizedHttpException if the provided value cannot be parsed as tags.
 * @param props - The properties for the TagsInput component.
 * @returns A JSX element representing the tags input field.
 */
export function TagsInput(
  { name, required, value, autofocus, form, ...dataProps }: TagsInputProps,
) {
  const [tagsValue, parseValueError] = parseTags(value)
  if (parseValueError) {
    throw new LocalizedHttpException({
      status: 400,
      technicalMessage: "Invalid tags value provided.",
      cause: parseValueError,
      localizedTitle: lt`The stored tags are invalid.`,
      localizedMessage:
        lt`We couldn't parse the stored tags. Please contact support for assistance.`,
    })
  }
  return (
    <input
      class={cx("input tags-input")}
      name={name}
      value={tagsValue.join(",")}
      required={required}
      autofocus={autofocus}
      form={form}
      {...dataProps}
    />
  )
}

/**
 * Properties for the TagsInput component.
 */
export interface TagsInputProps {
  /**
   * The name attribute for the input element.
   */
  name?: string
  /**
   * Indicates whether the input is required.
   */
  required?: boolean
  /**
   * The value of the input, which can be a string or an array of strings.
   */
  value?: string[] | string
  /**
   * Indicates whether the input should be autofocused.
   */
  autofocus?: boolean
  /**
   * The form attribute for the input element.
   */
  form?: string
  /**
   * Additional data attributes to be added to the input element.
   */
  [dataProps: `data-${string}`]: string | undefined
}
