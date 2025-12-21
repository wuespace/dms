import { Hono } from "@hono/hono"
import { LocalizedHttpException, lt, t } from "@wuespace/honolate"
import { ArchivedDocumentModel } from "../../model/documents/ArchivedDocument.ts"
import { DocumentMetadataForm } from "../components/DocumentMetadataForm.tsx"
import { WithPDFPreview } from "../components/WithPDFPreview.tsx"
import { withConfig } from "../middleware/with-config.ts"
import { withDB } from "../middleware/with-db.ts"
import { withUser } from "../middleware/with-user.tsx"

export const archivedRouter = new Hono()
  .use(withConfig, withDB, withUser)

archivedRouter
  .get("/:asn", async (c) => {
    const { asn } = c.req.param()
    const archivedDocsRepo = new ArchivedDocumentModel(
      c.var.db,
      c.var.user,
      c.var.config,
    )
    const [doc, err] = await archivedDocsRepo.get({ asn })
    if (err) {
      throw new LocalizedHttpException({
        status: 500,
        technicalMessage: "Failed to get archived document",
        localizedTitle: lt`Archived Document Retrieval Error`,
        localizedMessage:
          lt`The server encountered an issue while retrieving the archived document. Please contact support for assistance.`,
        cause: err,
      })
    }
    if (!doc.length) {
      throw new LocalizedHttpException({
        status: 404,
        technicalMessage: "Document not found",
        localizedTitle: lt`Document Not Found`,
        localizedMessage:
          lt`The requested archived document could not be found. It may have been removed or the ${c.var.config.asnPrefix} document number is incorrect.`,
      })
    }
    return c.render(
      <>
        <title>{t`${doc[0].title} - WüSpace DMS`}</title>
        <meta
          name="citation_technical_report_number"
          content={c.var.config.asnPrefix + " " + doc[0].asn}
        />
        <meta name="citation_type" content="document" />

        <meta name="citation_title" content={doc[0].title} />
        <meta
          name="citation_publication_date"
          content={doc[0].date.toISOString().split("T")[0]}
        />
        <meta
          name="citation_technical_report_institution"
          content="WüSpace e. V."
        />
        <meta
          name="citation_pdf_url"
          content={doc[0].processedFilePath.substring(4)}
        />
        <meta name="description" content={doc[0].content} />
        {doc[0].tags.map((tag: string) => (
          <meta name="keywords" content={tag} key={tag} />
        ))}
        <meta name="citation_keywords" content={doc[0].tags.join(",")} />
        <link
          rel="alternate"
          type="application/pdf"
          href={doc[0].processedFilePath.substring(4)}
        />
        <WithPDFPreview pdfSrc={doc[0].processedFilePath.substring(4)}>
          <h1 className="title is-2">{doc[0].title}</h1>
          <p className="subtitle is-4">{doc[0].date.toDateString()}</p>
          <DocumentMetadataForm
            title={doc[0].title}
            content={doc[0].content}
            date={doc[0].date.toDateString()}
            asn={doc[0].asn}
            tags={doc[0].tags}
          />
        </WithPDFPreview>
      </>,
    )
  })
