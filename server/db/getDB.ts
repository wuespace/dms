import { Database, MongoClient } from "@db/mongo"
import { EnvNotSetError } from "@wuespace/envar"
import {
  ARCHIVED_DOCUMENTS_COLLECTION,
  INBOX_DOCUMENTS_COLLECTION,
  PROCESSING_ERRORS_COLLECTION,
  UNPROCESSED_DOCUMENTS_COLLECTION,
} from "../model/collections.ts"
import { AsyncResult, wrapAsync } from "../result.ts"
import { getLogger } from "../log.ts"

const logger = getLogger("db")

const UNIQUE_INDEXES = [
  [ARCHIVED_DOCUMENTS_COLLECTION, "id"],
  [ARCHIVED_DOCUMENTS_COLLECTION, "asn"],
  [INBOX_DOCUMENTS_COLLECTION, "id"],
  [PROCESSING_ERRORS_COLLECTION, "id"],
  [UNPROCESSED_DOCUMENTS_COLLECTION, "id"],
]

/**
 * The MongoDB client instance.
 */
const client = new MongoClient()
/**
 * The database connection instance.
 *
 * Re-used across multiple calls to `getDB` to avoid redundant connections.
 */
let conn: Database

/**
 * Gets the database connection.
 * @returns the database or an error
 */
export async function getDB(): AsyncResult<Database, Error> {
  const MONGO_URI = Deno.env.get("MONGO_URI")
  if (!MONGO_URI) {
    return [
      null,
      new EnvNotSetError("MONGO_URI"),
    ]
  }

  if (conn) {
    // Re-use existing connection
    return [conn, null]
  }

  const [db, dbError] = await wrapAsync(
    client.connect(MONGO_URI),
  )

  if (dbError) {
    return [null, dbError]
  }

  conn = db

  return setupIndexes(db)
    .then(() => [db, null] as const)
    .catch((err) => [null, err] as const)
}

let SETUP_COMPLETED = false
/**
 * Sets up the necessary indexes on the database collections.
 * Runs only once per application lifetime, subsequent calls are no-ops.
 * @param db the database object to set the indexes up on
 * @returns a `Promise` that resolves if the index creation is successful
 */
async function setupIndexes(db: Database) {
  if (SETUP_COMPLETED) return
  SETUP_COMPLETED = true

  logger.withMetadata({
    indexes: UNIQUE_INDEXES,
  }).debug("Setting up database indexes.")

  for (const [collection, field] of UNIQUE_INDEXES) {
    await db.collection(collection).createIndexes(
      {
        indexes: [{
          name: `${field}_1`,
          key: { [field]: 1 },
          unique: true,
        }],
      },
    )
  }

  logger.debug("Setting up full text search index.")

  // Full text search index
  await db.collection(ARCHIVED_DOCUMENTS_COLLECTION).createIndexes(
    {
      indexes: [{
        name: "text",
        key: {
          title: "text",
          content: "text",
          asn: "text",
        },
        weights: {
          title: 5,
          content: 1,
          asn: 3,
        },
      }],
    },
  )
}
