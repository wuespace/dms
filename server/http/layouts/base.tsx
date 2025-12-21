import { PropsWithChildren } from "@hono/hono/jsx"
import { Style } from "@hono/hono/css"
import { useRequestContext } from "@hono/hono/jsx-renderer"
import { routePath } from "@hono/hono/route"
import { t, useLocale } from "@wuespace/honolate"

export const BaseLayout = (
  { children }: PropsWithChildren,
) => {
  const context = useRequestContext()

  function isActive(path: string, exact = false) {
    if (exact) {
      return routePath(context) === path ? "is-active" : ""
    }
    return routePath(context).startsWith(path) ? "is-active" : ""
  }

  const langSwitcherTitle = useLocale() === "de"
    ? t`Switch language to English`
    : t`Switch language to German`

  return (
    <html lang={useLocale()}>
      <head>
        <meta charset="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
        <link
          rel="icon"
          type="image/png"
          href="/static/favicon/favicon-96x96.png"
          sizes="96x96"
        />
        <link
          rel="icon"
          type="image/svg+xml"
          href="/static/favicon/favicon.svg"
        />
        <link rel="shortcut icon" href="/static/favicon/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/static/favicon/apple-touch-icon.png"
        />
        <link rel="manifest" href="/static/favicon/site.webmanifest" />
        <link rel="stylesheet" href="/static/dist/client.css" />
        <link rel="stylesheet" href="/static/dist/theme.css" />
        <Style />
      </head>
      <body>
        <header id="layout__header" className="navbar is-dark">
          <div className="navbar-brand">
            <a href="/" className="navbar-item">
              {t`WüSpace DMS`}
            </a>
            <a
              href={useLocale() === "de" ? "?lang=en" : "?lang=de"}
              title={langSwitcherTitle}
              aria-label={langSwitcherTitle}
              className="navbar-item"
            >
              {new Date().getMonth() === 5 /* 5 = June = Pride month */ &&
                  new Date().getDate() === 1 /* 1 = first day of month */
                ? (useLocale() === "de" ? "🏳️‍🌈" : "🏳️‍⚧️")
                : (useLocale() === "de" ? "🇬🇧" : "🇩🇪")}
            </a>
          </div>
          <div className="is-flex-grow-1">
            <form
              className="navbar-item is-flex-grow-1"
              action="/search"
              name={SEARCH_FORM_NAME}
              id={SEARCH_FORM_NAME}
            >
              <div className="field has-addons is-flex-grow-1">
                <p className="control is-flex-grow-1">
                  <input
                    name="q"
                    type="text"
                    className="input"
                    placeholder="Full-text search"
                    value={context.req.query("q")}
                  />
                </p>
                <p className="control">
                  <button className="button" type="submit">
                    {t`Search`}
                  </button>
                </p>
              </div>
            </form>
          </div>
        </header>
        <nav id="layout__sidebar" className="section">
          <aside class="menu">
            <p className="menu-label">General</p>
            <ul className="menu-list">
              <li>
                <a href="/" class={isActive("/", true)}>
                  {t`Dashboard`}
                </a>
              </li>
              <li>
                <a
                  href="/inbox"
                  class={isActive("/inbox")}
                >
                  {t`Inbox`}{" "}
                  <span
                    className="tag inbox-counter"
                    hx-get="/inbox/count"
                    hx-trigger="load, every 10s"
                  >
                    -
                  </span>
                </a>
              </li>
            </ul>
            <p className="menu-label">
              {t`Documents`}
            </p>
            <ul className="menu-list">
              <li>
                <a
                  href="/files"
                  class={isActive("/files")}
                >
                  {t`File Cabinet`}
                </a>
              </li>
              <li>
                <a
                  href="/search"
                  class={isActive("/search")}
                >
                  {t`Search`}
                </a>
              </li>
              <li>
                <a
                  href="/upload"
                  class={isActive("/upload")}
                >
                  {t`Upload a Document`}
                </a>
              </li>
            </ul>
            <p className="menu-label">
              {t`User`}
            </p>
            <ul className="menu-list">
              <li>
                <a href="/logout">
                  {t`Logout`}
                </a>
              </li>
            </ul>
          </aside>
        </nav>
        <main id="layout__main" className="">
          {children}
        </main>
        <script src="/static/dist/client.js" type="module"></script>
      </body>
    </html>
  )
}

export const SEARCH_FORM_NAME = "search"
