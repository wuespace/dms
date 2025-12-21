import { Hono } from "@hono/hono"
import { staticRoutes } from "./routes/static.ts"
import { uiRouter } from "./routes/ui.tsx"
import { sentry } from "./middleware/sentry.ts"
import { getLogger, withRequestLogger } from "../log.ts"

export type { Hono as HonoApp } from "@hono/hono"

export function runServer(port: number = 41319) {
  const ac = new AbortController()
  const handler = (signal: Deno.Signal) => {
    getLogger("server").withMetadata({ signal }).info(
      "Caught signal.",
      "Shutting down server.",
    )
    ac.abort(signal)
  }
  ;(["SIGHUP", "SIGINT", "SIGTERM"] as Deno.Signal[]).forEach((signal) =>
    Deno.addSignalListener(signal, () => handler(signal))
  )

  const server = Deno.serve(
    {
      port: port,
      signal: ac.signal,
      onListen: (data) =>
        getLogger("server").withMetadata(data).info(
          `Server running on http://localhost:${port}`,
        ),
    },
    app.fetch,
  )
  return server.finished
}

export const app = new Hono()

app.use(withRequestLogger)
app.use(sentry)

app.route("/", staticRoutes)
app.mount("/", uiRouter.fetch)
