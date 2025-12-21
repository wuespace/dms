#! /usr/bin/env -S deno run -A
import { z } from "@zod/zod"
import { initVariable } from "@wuespace/envar"
import { getDB } from "./server/db/getDB.ts"
import { getConfig } from "./server/getConfig.ts"
import { runServer } from "./server/http/mod.ts"
import { initFolderIngest } from "./server/ingest/mod.ts"
import { getLogger } from "./server/log.ts"

const logger = getLogger("main")

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  try {
    // Set default path for CONFIG file retrieval before setting up CONFIG
    await setupEnvironment()

    // Validate the configuration and connect to the database
    const [_config, configError] = getConfig()
    if (configError) {
      logger.withError(configError).fatal("Could not load config.")
      Deno.exit(1)
    }

    const [_db, getDBError] = await getDB()
    if (getDBError) {
      logger.withError(getDBError).withMetadata({
        mongoUri: Deno.env.get("MONGO_URI")!,
      }).fatal("Could not connect to database.")
      Deno.exit(1)
    }

    // Initialize background tasks
    await initFolderIngest()

    // Start the server
    await runServer()

    Deno.exit(0)
  } catch (error) {
    logger.withError(error as Error).fatal("Unhandled error in main.")
    Deno.exit(1)
  }
}

async function setupEnvironment() {
  const logger = getLogger("env-setup")

  await initVariable("CONFIG_FILE", z.string(), "config/config.yml")
  logger.withMetadata({
    configFile: Deno.env.get("CONFIG_FILE")!,
  }).debug("Config file path set.")

  // Set up used environment variables
  await Promise.all([
    initVariable(
      "MONGO_URI",
      z.string().url(),
      "mongodb://localhost:27017",
    ),
    initVariable("OIDC_AUTH_SECRET", z.string().min(32)),
    initVariable("OIDC_CLIENT_ID", z.string()),
    initVariable("OIDC_CLIENT_SECRET", z.string()),
    initVariable("OIDC_ISSUER", z.url()),
    initVariable("OIDC_REDIRECT_URI", z.url().endsWith("/oidc/callback")),
    initVariable("OIDC_SCOPES", z.string().includes("openid")),
    initVariable("OIDC_ROLES_CLAIM", z.string(), "roles"),
    initVariable("OIDC_UID_CLAIM", z.string(), "sub"),
    initVariable("OIDC_NAME_CLAIM", z.string(), "name"),
    initVariable(
      "SENTRY_DSN",
      z.string().url().optional(),
    ),
    initVariable("CONFIG", z.string()),
    initVariable("FOLDER_INGEST_CRON", z.string().optional()),
    initVariable("FOLDER_INGEST_PATH", z.string().optional()),
  ]).catch((e) => {
    logger.withError(e).fatal("Failed to initialize environment variables.")
    Deno.exit(1)
  })
  logger.withMetadata({
    sentryDsn: Deno.env.get("SENTRY_DSN") ? "set" : "not set",
  }).debug("Sentry DSN checked.")
  logger.withMetadata({
    FOLDER_INGEST_CRON: Deno.env.get("FOLDER_INGEST_CRON") ?? "not set",
    FOLDER_INGEST_PATH: Deno.env.get("FOLDER_INGEST_PATH") ?? "not set",
  }).debug("Folder ingest variables checked.")
}
