import { Database } from "@db/mongo"
import { createMiddleware } from "@hono/hono/factory"
import { LocalizedHttpException, lt } from "@wuespace/honolate"
import { getDB } from "../../db/getDB.ts"
import { Config } from "../../getConfig.ts"

/**
 * Middleware that ensures a database connection is available in the context.
 * If not already present, it initializes the connection using the provided configuration.
 * @throws {LocalizedHttpException} If configuration is missing or database connection fails.
 */
export const withDB = createMiddleware<{
  Variables: {
    readonly config?: Config
    readonly db: Database
  }
}>(async (c, next) => {
  if (c.get("db")) {
    return next()
  }

  if (!c.var.config) {
    throw new LocalizedHttpException({
      status: 500,
      technicalMessage:
        "Configuration not loaded, but required for withDB middleware.",
      localizedTitle: lt`Configuration Not Loaded`,
      localizedMessage:
        lt`The server configuration must be loaded before initializing the database connection. Please contact support for assistance.`,
      cause: "c.var.config was " + String(c.var.config),
    })
  }

  const [db, dbError] = await getDB()

  if (dbError) {
    throw new LocalizedHttpException({
      status: 500,
      technicalMessage: "Database connection failed",
      localizedTitle: lt`Database Connection Failed`,
      localizedMessage:
        lt`The server encountered an issue while connecting to the database. Please contact support for assistance.`,
      cause: dbError,
    })
  }

  c.set("db", db)
  await next()
})
