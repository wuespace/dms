import { PropsWithChildren } from "@hono/hono/jsx"

/**
 * A breadcrumb navigation component.
 *
 * Takes children which are typically {@link Breadcrumb} components.
 */
export function Breadcrumbs({ children }: PropsWithChildren) {
  return (
    <nav class="breadcrumb" aria-label="breadcrumbs">
      <ul>
        {children}
      </ul>
    </nav>
  )
}

/**
 * A single breadcrumb item.
 *
 * Props:
 * - href: The URL the breadcrumb points to.
 * - active: Whether this breadcrumb is the active/current page.
 * Children: The content of the breadcrumb (usually text).
 *
 * Commonly used within a {@link Breadcrumbs} component.
 */
export function Breadcrumb(
  { href, children, active }: PropsWithChildren<
    { href: string; active?: boolean }
  >,
) {
  return (
    <li class={active ? "is-active" : ""}>
      <a href={href} aria-current={active ? "page" : undefined}>
        {children}
      </a>
    </li>
  )
}
