import { AsyncLocalStorage } from "node:async_hooks"
import { ConsoleTransport, ILogLayer, LogLayer } from "loglayer"
import { getSimplePrettyTerminal } from "@loglayer/transport-simple-pretty-terminal"
import process from "node:process"
import { createMiddleware } from "@hono/hono/factory"
import { serializeError } from "serialize-error"

const isDevelopment = process.env.DEVELOPMENT === "true" ||
  process.env.ENVIRONMENT === "development"

const log = new LogLayer({
  errorSerializer: serializeError,
  transport: [
    getSimplePrettyTerminal({
      runtime: "node",
      viewMode: "expanded",
      enabled: isDevelopment,
      collapseArrays: false,
    }),
    new ConsoleTransport({
      enabled: !isDevelopment,
      // @ts-expect-error Deno type incompatibility
      logger: console,
      stringify: true,
      dateIsoString: true,
      dateField: "timestamp",
      levelField: "level",
      messageField: "message",
    }),
  ],
})
const ctx = new AsyncLocalStorage<ILogLayer>()

export function getLogger(prefix?: string): ILogLayer {
  const store = ctx.getStore()
  if (store) {
    return prefix ? store.child().withPrefix(prefix) : store
  }
  return prefix ? log.child().withPrefix(prefix) : log
}

export function runWithLogContext<T>(
  context: Record<string, unknown>,
  fn: () => T,
): T {
  return ctx.run(getLogger().child().withContext(context), fn)
}

export const withRequestLogger = createMiddleware(async (c, next) => {
  const requestId = c.req.header("X-Request-ID") ?? crypto.randomUUID()
  c.res.headers.set("X-Request-ID", requestId)
  const logger = getLogger().child().withContext({
    requestId: requestId,
    method: c.req.method,
    url: c.req.url,
  })
  // logger.info(`Incoming request: ${c.req.method} ${c.req.url}`);

  try {
    await ctx.run(logger, next)
  } finally {
    const loggerWithMetadata = logger.withMetadata({
      status: c.res.status,
    })
    if (c.res.status >= 400) {
      loggerWithMetadata.warn(
        `Request completed with error status.`,
      )
    } else {
      loggerWithMetadata.debug(
        `Successful request.`,
      )
    }
  }
})

export const withMetadataLogger = (context: Record<string, unknown>) =>
  createMiddleware(async (_c, next) => {
    const logger = getLogger().child().withContext(context)
    await ctx.run(logger, next)
  })
