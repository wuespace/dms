import { Cron } from "@hexagon/croner"
import { getDB } from "../db/getDB.ts"
import { getLogger, runWithLogContext } from "../log.ts"
import { wrap } from "../result.ts"
import { cleanUpStaleUnprocessedDocuments } from "./unprocessed-cleanup.ts"

const DEFAULT_CRON = "0 3 * * *"
const DEFAULT_MAX_AGE_DAYS = 2

/**
 * Initializes the background job that removes stale unprocessed documents.
 * Runs once immediately (stale documents are usually the result of a
 * shutdown) and then according to the schedule.
 *
 * Environment variables:
 * - `UNPROCESSED_CLEANUP_CRON`: cron schedule (default: daily at 3:00)
 * - `UNPROCESSED_CLEANUP_MAX_AGE_DAYS`: maximum age in days (default: 2)
 */
export function initUnprocessedCleanup() {
  const logger = getLogger("unprocessed-cleanup")

  const cronEnv = Deno.env.get("UNPROCESSED_CLEANUP_CRON") || DEFAULT_CRON
  const maxAgeDays = parseMaxAgeDays(
    Deno.env.get("UNPROCESSED_CLEANUP_MAX_AGE_DAYS"),
  )
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000

  const run = () =>
    runWithLogContext({
      ...logger.getContext(),
      cronId: "unprocessed-cleanup-cron",
      cronRunId: crypto.randomUUID(),
      cronStartTime: new Date(),
    }, async () => {
      const logger = getLogger("unprocessed-cleanup-cron")
      const [db, dbError] = await getDB()
      if (dbError) {
        logger.withError(dbError).error("Could not connect to the database.")
        return
      }
      try {
        const result = await cleanUpStaleUnprocessedDocuments(db, maxAgeMs)
        logger.withMetadata(result).info("Unprocessed cleanup run complete.")
      } catch (error) {
        logger.withError(error as Error).error("Unprocessed cleanup failed.")
      }
    })

  let [cronJob, cronError] = wrap(() => new Cron(cronEnv, run))
  if (cronError) {
    logger.withError(cronError).error(
      "Invalid UNPROCESSED_CLEANUP_CRON. Falling back to default.",
    )
    ;[cronJob, cronError] = wrap(() => new Cron(DEFAULT_CRON, run))
  }
  if (cronError || !cronJob) {
    logger.withError(cronError ?? new Error("No cron job")).error(
      "Failed to create cleanup cron job.",
    )
    return
  }

  logger.withMetadata({ nextRun: cronJob.nextRun(), maxAgeDays }).info(
    "Unprocessed cleanup cron job initialized.",
  )

  // Don't block startup
  run()
}

function parseMaxAgeDays(value: string | undefined): number {
  const parsed = Number(value)
  if (!value || !Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_MAX_AGE_DAYS
  }
  return parsed
}
