import { Hono } from "@hono/hono"
import { jsxRenderer } from "@hono/hono/jsx-renderer"
import { LocalizedHttpException, lt, t } from "@wuespace/honolate"
import { i18n } from "../../../i18n.ts"
import { getLogger } from "../../log.ts"
import { BaseLayout } from "../layouts/base.tsx"
import { sentry } from "../middleware/sentry.ts"
import { withConfig } from "../middleware/with-config.ts"
import { withDB } from "../middleware/with-db.ts"
import { withUser } from "../middleware/with-user.tsx"
import { archivedRouter } from "./archived.tsx"
import { dashboardRouter } from "./dashboard.tsx"
import { fileRouter } from "./files.tsx"
import { inboxRouter } from "./inbox.tsx"
import { searchRouter } from "./search.tsx"
import { uploadRouter } from "./upload.tsx"
import { uiSupportRouter } from "./ui-support.tsx"

export const uiRouter = new Hono()
  .use(sentry, i18n)
  .use(jsxRenderer(BaseLayout))
  .use(withUser, withConfig, withDB)

uiRouter.get("/me", withUser, (c) => c.json(c.var.user))

uiRouter.onError((err, c) => {
  const logger = getLogger()
  const localizedException = LocalizedHttpException.fromCause(err)
  c.status(localizedException.status)
  logger.withError(err).error("Unhandled UI Router Error.")

  return c.render(
    <div class="section">
      <title>{t`Error - WüSpace DMS`}</title>
      <h1 className="title is-2">
        {t`An error occurred: ${
          t(localizedException.options.localizedTitle ?? lt`Unknown Error`)
        }`}
      </h1>
      <p class="block">
        {localizedException.options.localizedMessage
          ? t(localizedException.options.localizedMessage)
          : t`An unexpected error has occurred. Please try again later or contact support.`}
      </p>
      <p className="block">
        {t`When contacting support, please provide the following error ID: ${(
          <code>{localizedException.errorId}</code>
        )}. Otherwise, support may not be able to assist you.`}
      </p>
    </div>,
  )
})

uiRouter.route("/", dashboardRouter)
uiRouter.route("/inbox", inboxRouter)
uiRouter.route("/files", fileRouter)
uiRouter.route("/search", searchRouter)
uiRouter.route("/archived", archivedRouter)
uiRouter.route("/upload", uploadRouter)
uiRouter.route("/__/", uiSupportRouter)

uiRouter.notFound((c) => {
  c.status(404)
  return c.render(
    <div class="section">
      <title>{t`404 Not Found - WüSpace DMS`}</title>
      <h1 className="title is-2">
        {t`404 Not Found`}
      </h1>
      <p class="block">
        {t`The page you are looking for does not exist.`}
      </p>
    </div>,
  )
})
