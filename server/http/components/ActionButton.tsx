import { css, cx } from "@hono/hono/css"

export interface ActionButtonProps {
  /**
   * The color of the button.
   */
  color?: "primary" | "danger"
  /**
   * The HTTP method to use when submitting the form.
   */
  method: "get" | "post"
  /**
   * The URL to submit the form to.
   */
  action: string
  /**
   * A title attribute for the button. Shows a tooltip when hovered.
   */
  title?: string
  /**
   * A confirmation message to show before submitting when the button is clicked.
   */
  confirm?: string
  children: string
}
export function ActionButton(props: ActionButtonProps) {
  return (
    <form
      method={props.method}
      action={props.action}
      class={css`
        display: contents;
      `}
      data-confirm={props.confirm}
    >
      <button
        type="submit"
        className={cx(
          "button",
          props.color === "primary" && "is-primary",
          props.color === "danger" && "is-danger",
        )}
        title={props.title}
      >
        {props.children}
      </button>
    </form>
  )
}
