import { Hono } from "@hono/hono"
import { extname, resolve } from "@std/path"
import { monotonicUlid } from "@std/ulid"
import { LocalizedHttpException, lt, t } from "@wuespace/honolate"
import { unprocessedToInbox } from "../../document-lifecycle/unprocessed-to-inbox.ts"
import { getLogger } from "../../log.ts"
import { UnprocessedDocumentModel } from "../../model/documents/UnprocessedDocument.ts"
import { FileUpload } from "../components/FileUpload.tsx"
import { LinkCard } from "../components/link-card.tsx"
import { withConfig } from "../middleware/with-config.ts"
import { withDB } from "../middleware/with-db.ts"
import { withUser } from "../middleware/with-user.tsx"

const MAX_UPLOAD_SIZE_MB = 20
const UPLOAD_DIR = resolve("data/unprocessed")

export const uploadRouter = new Hono()

uploadRouter.get("/", withConfig, (c) => {
  return c.render(
    <div class="section">
      <title>{t`Upload a document - WüSpace DMS`}</title>
      <h1 class="title is-2">{t`Upload a document`}</h1>
      {c.var.config.asnGeneratorUrl && (
        <LinkCard
          title={t`Generate document (${c.var.config.asnPrefix}) numbers`}
          subtitle={t`Before you can archive documents using the DMS, you need to generate unique document numbers for them. Follow this link to generate some.`}
          target="_blank"
          href={c.var.config.asnGeneratorUrl}
        />
      )}
      <p class="block">{t`Upload a document`}</p>
      <FileUpload />
    </div>,
  )
})

uploadRouter.post("/", withConfig, withDB, withUser, async (c) => {
  c.status(201)

  const body = await c.req.parseBody()
  if (!body) {
    throw new LocalizedHttpException({
      status: 400,
      technicalMessage: "No body provided in upload request.",
    })
  }
  const file = body["files"]
  if (!file) {
    throw new LocalizedHttpException({
      status: 400,
      technicalMessage: "No files provided in upload request.",
    })
  }

  if (typeof file === "string") {
    throw new LocalizedHttpException({
      status: 400,
      technicalMessage: "Expected a file upload, but got a string.",
    })
  }

  if (file.size > MAX_UPLOAD_SIZE_MB * (1024 ** 2)) {
    const uploadedFileMB = (file.size / 1024 / 1024).toPrecision(3)
    throw new LocalizedHttpException({
      status: 400,
      technicalMessage: "File is too large.",
      localizedTitle: lt`File is too large`,
      localizedMessage:
        lt`The uploaded file "${file.name}" exceeds the maximum allowed size of ${MAX_UPLOAD_SIZE_MB} MB. Please upload a smaller file.`,
      cause: {
        maxSize: `${MAX_UPLOAD_SIZE_MB} MB`,
        uploadedSize: `${uploadedFileMB} MB`,
        fileName: file.name,
      },
    })
  }

  const fileExtension = extname(file.name)
  const id = monotonicUlid()
  const fileName = `${id}${fileExtension}`

  await Deno.mkdirSync(UPLOAD_DIR, { recursive: true })
  // Save the file to the server
  await Deno.writeFile(
    resolve(UPLOAD_DIR, fileName),
    new Uint8Array(await file.arrayBuffer()),
  )
  await Deno.chmod(resolve(UPLOAD_DIR, fileName), 0o644)

  const unprocessedCollection = new UnprocessedDocumentModel(
    c.var.db,
    c.var.user,
  )

  const [unprocessedDocument, addUnprocessedDocumentErr] =
    await unprocessedCollection.add({
      id,
      path: resolve(UPLOAD_DIR, fileName),
      originalFilename: file.name,
    })

  if (addUnprocessedDocumentErr) {
    throw new LocalizedHttpException({
      status: 500,
      technicalMessage: "Failed to add unprocessed document to database",
      localizedTitle: lt`Failed to add unprocessed document to database`,
      localizedMessage:
        lt`An error occurred while adding the unprocessed document to the database. Please try again later or contact support.`,
      cause: addUnprocessedDocumentErr,
    })
  }

  unprocessedToInbox(c.var.db, unprocessedDocument.id, c.var.user).then(
    ([_, error]) => {
      if (error) {
        getLogger().withError(error).error("Failed to process document.")
      }
    },
  )

  return c.text(t`Document uploaded successfully. Document ID: ${id}`)
})
