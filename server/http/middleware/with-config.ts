import { createMiddleware } from "@hono/hono/factory"
import { LocalizedHttpException, lt } from "@wuespace/honolate"
import { Config, getConfig } from "../../getConfig.ts"
import { runWithLogContext } from "../../log.ts"

/**
 * Middleware that fetches and attaches the server configuration to the context.
 */
export const withConfig = createMiddleware<{
  Variables: {
    readonly config: Config
  }
}>(async (c, next) => {
  if (c.get("config")) {
    return next()
  }

  const [config, getConfigError] = getConfig()
  if (getConfigError) {
    throw new LocalizedHttpException({
      status: 500,
      technicalMessage: "An error occurred while fetching the configuration.",
      localizedTitle: lt`Server Configuration Error`,
      localizedMessage:
        lt`We encountered an issue while retrieving the server configuration. Please contact support for assistance.`,
      cause: getConfigError,
    })
  }
  c.set("config", config)
  await runWithLogContext({ config }, next)
})
