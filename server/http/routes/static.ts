import { Hono } from "@hono/hono"
import { serveStatic } from "@hono/hono/deno"
import { forbidExtensions } from "../middleware/forbid-extensions.ts"

export const staticRoutes = new Hono()

staticRoutes.get("/static/*", serveStatic({ root: "./" }))
staticRoutes.get(
  "/data/*",
  // disallow access to metadata files as this would expose file IDs
  forbidExtensions([".json"]),
  serveStatic({
    root: "./",
  }),
)
