import { Hono } from "@hono/hono"
import { LocalizedHttpException, lt, t } from "@wuespace/honolate"
import { dismissInboxDocument } from "../../document-lifecycle/inbox-dismiss.ts"
import { inboxToArchive } from "../../document-lifecycle/inbox-to-archived.ts"
import { InboxDocumentModel } from "../../model/documents/InboxDocument.ts"
import { ActionButton } from "../components/ActionButton.tsx"
import { DocumentCard } from "../components/DocumentCard.tsx"
import { DocumentMetadataForm } from "../components/DocumentMetadataForm.tsx"
import { FileUpload } from "../components/FileUpload.tsx"
import { WithPDFPreview } from "../components/WithPDFPreview.tsx"
import { withConfig } from "../middleware/with-config.ts"
import { withDB } from "../middleware/with-db.ts"
import { withUser } from "../middleware/with-user.tsx"
import { archivedDocumentValidator } from "../validators/archived-document.ts"
import { DocumentGrid } from "../components/DocumentGrid.tsx"
import { DocumentGridLayoutSelector } from "../components/DocumentGridLayoutSelector.tsx"
import { UnprocessedDocumentModel } from "../../model/documents/UnprocessedDocument.ts"

export const inboxRouter = new Hono()
  .use(withConfig, withDB, withUser)

inboxRouter.get("/", async (c) => {
  const inboxCollection = new InboxDocumentModel(c.var.db, c.var.user)
  const [inboxDocuments, getInboxDocsError] = await inboxCollection.get()

  if (getInboxDocsError) {
    throw new LocalizedHttpException({
      status: 500,
      technicalMessage: "Failed to get inbox documents",
      localizedTitle: lt`Failed to get inbox documents`,
      localizedMessage:
        lt`An error occurred while fetching the inbox documents. Please try again later or contact support.`,
      cause: getInboxDocsError,
    })
  }

  return c.render(
    <div class="section">
      <title>{t`Inbox - WüSpace DMS`}</title>
      <h1 class="title is-2">{t`Inbox`}</h1>
      <p class="subtitle is-4">
        {t`Your uploaded documents will appear here. Add metadata to archive them.`}
      </p>
      <FileUpload />
      <div
        // Placeholder div to load unprocessed document notifications via htmx
        hx-get="/inbox/unprocessed"
        hx-trigger="load, every 2s"
        hx-swap="innerHTML"
      />
      <DocumentGrid
        noDocumentsFoundMessage={t`There are no documents in your inbox. Upload some files to get started or wait for uploaded files to finish processing.`}
      >
        {inboxDocuments.map((doc) => (
          <DocumentCard
            doc={doc}
            asnPrefix={c.var.config.asnPrefix}
            href={`/inbox/${doc.id}`}
          />
        ))}
      </DocumentGrid>
      {!!inboxDocuments.length && <DocumentGridLayoutSelector />}
    </div>,
  )
})

inboxRouter.get("/unprocessed", async (c) => {
  const unprocessedDocsCollection = new UnprocessedDocumentModel(
    c.var.db,
    c.var.user,
  )
  const [unprocessedDocuments, getUnprocessedDocsError] =
    await unprocessedDocsCollection.get({})

  if (getUnprocessedDocsError) {
    throw new LocalizedHttpException({
      status: 500,
      technicalMessage: "Failed to get unprocessed documents",
      localizedTitle: lt`Failed to get unprocessed documents`,
      localizedMessage:
        lt`An error occurred while fetching the unprocessed documents. Please try again later or contact support.`,
      cause: getUnprocessedDocsError,
    })
  }

  if (unprocessedDocuments.length === 0) {
    return c.html("")
  }

  return c.html(
    <article class="notification mb-4 is-warning">
      <p>
        {t`${unprocessedDocuments.length} documents have been uploaded but not yet processed. They will be processed automatically in the background.`}
      </p>
    </article>,
  )
})

inboxRouter.get("/count", async (c) => {
  const inboxCollection = new InboxDocumentModel(c.var.db, c.var.user)
  const [inboxCount, inboxCountError] = await inboxCollection.count()

  if (inboxCountError) {
    throw new LocalizedHttpException({
      status: 500,
      technicalMessage: "Failed to get inbox count",
      localizedTitle: lt`Failed to get inbox count`,
      localizedMessage:
        lt`An error occurred while fetching the inbox count. Please try again later or contact support.`,
      cause: inboxCountError,
    })
  }

  return c.html(inboxCount.toString() || "-")
})

inboxRouter.get("/:id", async (c) => {
  const inboxCollection = new InboxDocumentModel(c.var.db, c.var.user)
  const [inboxDocument, getInboxDocError] = await inboxCollection.getOne(
    c.req.param("id"),
  )
  if (getInboxDocError) {
    throw new LocalizedHttpException({
      status: 404,
      technicalMessage: "Failed to get inbox document",
      localizedTitle: lt`Failed to get inbox document`,
      localizedMessage:
        lt`The inbox document you are looking for does not exist or could not be found.`,
      cause: getInboxDocError,
    })
  }

  return c.render(
    <WithPDFPreview pdfSrc={inboxDocument.processedFilePath.substring(4)}>
      <title>{t`Inbox: ${inboxDocument.suggestedTitle} - WüSpace DMS`}</title>
      <div className="field">
        <ActionButton
          method="post"
          action={`/inbox/${inboxDocument.id}/discard`}
          color="danger"
          title={t`Discard this document and remove it from the inbox`}
          confirm={t`Are you sure you want to discard this document? This action cannot be undone.`}
        >
          {t`Discard this document`}
        </ActionButton>
      </div>
      <DocumentMetadataForm
        title={inboxDocument.suggestedTitle}
        asn={inboxDocument.suggestedASN}
        tags={inboxDocument.suggestedTags}
        content={inboxDocument.content}
        date={inboxDocument.date.toISOString().substring(0, 10)}
        action={`/inbox/${inboxDocument.id}`}
        asnGeneratorUrl={c.var.config.asnGeneratorUrl}
      />
    </WithPDFPreview>,
  )
})

inboxRouter.post(
  "/:id",
  archivedDocumentValidator,
  async (c) => {
    const inboxCollection = new InboxDocumentModel(c.var.db, c.var.user)
    const [inboxDoc, getInboxDocError] = await inboxCollection.getOne(
      c.req.param("id") ?? "",
    )
    if (getInboxDocError) {
      throw new LocalizedHttpException({
        status: 404,
        technicalMessage: "Failed to get inbox document",
        localizedTitle: lt`Failed to get inbox document`,
        localizedMessage:
          lt`The inbox document you are looking for does not exist or could not be found.`,
        cause: getInboxDocError,
      })
    }

    const [archivedDocument, inboxToArchiveError] = await inboxToArchive(
      c.var.db,
      inboxDoc.id,
      c.req.valid("form"),
      c.var.user,
      c.var.config,
    )

    if (inboxToArchiveError) {
      throw new LocalizedHttpException({
        status: 500,
        technicalMessage: "Failed to archive document",
        localizedTitle: lt`Failed to archive document`,
        localizedMessage:
          lt`An error occurred while archiving the document. Please try again later or contact support.`,
        cause: inboxToArchiveError,
      })
    }

    return c.redirect(`/archived/${archivedDocument.asn}`)
  },
)

inboxRouter.post("/:id/discard", async (c) => {
  const inboxCollection = new InboxDocumentModel(c.var.db, c.var.user)
  const [inboxDoc, getInboxDocError] = await inboxCollection.getOne(
    c.req.param("id") ?? "",
  )
  if (getInboxDocError) {
    throw new LocalizedHttpException({
      status: 404,
      technicalMessage: "Failed to get inbox document to discard",
      localizedTitle: lt`Failed to discard inbox document`,
      localizedMessage:
        lt`The inbox document you are trying to discard does not exist or could not be found.`,
      cause: getInboxDocError,
    })
  }

  const [_, deleteError] = await dismissInboxDocument(
    c.var.db,
    inboxDoc.id,
    c.var.user,
  )
  if (deleteError) {
    throw new LocalizedHttpException({
      status: 500,
      technicalMessage: "Failed to discard inbox document",
      localizedTitle: lt`Failed to discard inbox document`,
      localizedMessage:
        lt`An error occurred while discarding the inbox document. Please try again later or contact support.`,
      cause: deleteError,
    })
  }

  return c.redirect("/inbox")
})
