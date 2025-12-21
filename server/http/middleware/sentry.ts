import { createMiddleware } from "@hono/hono/factory"
import { sentry as libSentry } from "@hono/sentry"

const SENTRY_DSN = Deno.env.get("SENTRY_DSN")

/**
 * Middleware that initializes Sentry error tracking if a DSN is provided.
 */
export const sentry = createMiddleware((c, next) => {
  if (!SENTRY_DSN) {
    // Sentry is disabled if no DSN is provided
    return next()
  }

  if (c.get("sentry")) {
    // Sentry is already initialized
    return next()
  }

  // deno-lint-ignore no-explicit-any
  return libSentry({ dsn: SENTRY_DSN })(c as any, next)
})
