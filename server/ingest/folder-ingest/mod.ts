import { Cron } from "@hexagon/croner"
import { exists } from "@std/fs"
import { resolve } from "@std/path"
import { ingestDocument } from "../ingest-document.ts"
import { wrap } from "../../result.ts"
import { getLogger, runWithLogContext } from "../../log.ts"
import { redactContent } from "../../document-lifecycle/util/redact.ts"

/**
 * Initializes / starts the folder-based background ingest process.
 * Aborts early if the required environment variables are not set:
 * - `FOLDER_INGEST_CRON`: cron schedule for the ingest process
 * - `FOLDER_INGEST_PATH`: path to the folder to inges`
 * @param logger logger instance to use
 */
export async function initFolderIngest() {
  const logger = getLogger("folder-ingest")
  const cron = Deno.env.get("FOLDER_INGEST_CRON")
  const path = Deno.env.get("FOLDER_INGEST_PATH")
  logger.withContext({ cron, path })

  if (!cron || !path) {
    logger.info(
      "Folder ingest not configured. Set FOLDER_INGEST_CRON and FOLDER_INGEST_PATH to enable.",
    )
    return
  }

  if (!(await exists(path))) {
    logger.error("Folder Ingest Path does not exist.")
    return
  }

  if (!(await Deno.stat(path)).isDirectory) {
    logger.error("Path is not a directory.")
    return
  }

  const [cronJob, cronJobError] = wrap(
    () =>
      new Cron(cron, () =>
        runWithLogContext({
          ...logger.getContext(),
          cronId: "folder-ingest-cron",
          cronRunId: crypto.randomUUID(),
          cronStartTime: new Date(),
        }, async () => {
          const logger = getLogger("folder-ingest-cron")
          logger.debug("Running folder ingest.")

          if (!(await exists(path))) {
            logger.error("Folder Ingest Path does not exist.")
            return
          }

          if (!(await Deno.stat(path)).isDirectory) {
            logger.error("Folder Ingest Path is not a directory.")
            return
          }

          for await (const file of Deno.readDir(path)) {
            logger.withContext({ fileName: file.name })

            const [inboxDocument, ingestionError] = await ingestDocument(
              resolve(path, file.name),
            )
            if (ingestionError) {
              logger.withError(ingestionError).warn(
                "Error ingesting document.",
                "Ignoring and continuing.",
              )
              continue
            }
            logger.withContext({ inboxDocument: redactContent(inboxDocument) })
            logger.info("Ingested document.")
          }

          logger.info("Folder ingest run complete.")
        })),
  )

  if (cronJobError) {
    logger.withError(cronJobError).error(
      "Failed to create cron job for folder ingest.",
    )
    return
  }

  logger.withMetadata({ nextRun: cronJob.nextRun() }).info(
    "Folder ingest cron job initialized.",
  )
}
