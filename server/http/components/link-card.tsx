import { FC } from "@hono/hono/jsx"

/**
 * A card component that links to an external or internal URL.
 *
 * Props:
 * - title: The title of the card.
 * - subtitle: The subtitle of the card.
 * - description: Optional description content for the card.
 * - href: The URL the card links to.
 * - target: Optional target attribute for the link (e.g., "_blank" for new tab).
 */
export function LinkCard(
  { title, subtitle, href, target, description }: {
    title: string
    subtitle: string
    description?: ReturnType<FC>
    href: string
    target?: string
  },
) {
  return (
    <div className="block">
      <a
        href={href}
        target={target}
        rel={target ? "noopener noreferrer" : undefined}
      >
        <div className="card block">
          <div className="card-content">
            <p className="title is-4">{title}</p>
            <p className="subtitle is-6">{subtitle}</p>
            {description && <section className="content">{description}
            </section>}
          </div>
        </div>
      </a>
    </div>
  )
}
