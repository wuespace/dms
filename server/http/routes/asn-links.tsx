import { Hono } from "@hono/hono"
import { css, cx } from "@hono/hono/css"
import { LocalizedHttpException, lt, t } from "@wuespace/honolate"
import { z } from "@zod/zod"
import { getLogger } from "../../log.ts"
import {
  getFolderInformation,
  getRegisterInformation,
} from "../../model/asn-configuration.ts"
import { getAsnLinkStatus } from "../../model/asn-link-token.ts"
import { ArchivedDocumentModel } from "../../model/documents/ArchivedDocument.ts"
import { AsnLinkModel } from "../../model/documents/AsnLink.ts"
import { InboxDocumentModel } from "../../model/documents/InboxDocument.ts"
import { ActionButton } from "../components/ActionButton.tsx"
import { DateDisplay } from "../components/DateDisplay.tsx"
import { ASNField } from "../components/ASNField.tsx"
import { DocumentCard } from "../components/DocumentCard.tsx"
import { DocumentGrid } from "../components/DocumentGrid.tsx"
import { FileUpload } from "../components/FileUpload.tsx"
import { withConfig } from "../middleware/with-config.ts"
import { withDB } from "../middleware/with-db.ts"
import { withUser } from "../middleware/with-user.tsx"

const TTL_OPTIONS_DAYS = [7, 30, 90]
const DEFAULT_TTL_DAYS = 30

/**
 * ASN magic links let users with write access to an ASN allow any other
 * logged-in user to archive one document under exactly that ASN.
 */
export const asnLinksRouter = new Hono()
  .use(withConfig, withDB, withUser)

function internalError(message: string, cause: unknown) {
  return new LocalizedHttpException({
    status: 500,
    technicalMessage: message,
    localizedTitle: lt`Failed to process document number links`,
    localizedMessage:
      lt`An error occurred while processing the document number links. Please try again later or contact support.`,
    cause,
  })
}

asnLinksRouter.get("/", async (c) => {
  const links = new AsnLinkModel(c.var.db, c.var.user)
  const [asnLinks, error] = await links.listByCreator()
  if (error) throw internalError("Failed to list ASN links", error)

  const statusLabels = {
    valid: t`Valid`,
    used: t`Used`,
    revoked: t`Revoked`,
    expired: t`Expired`,
  }

  const statusColors = {
    valid: "is-success",
    used: "is-info",
    revoked: "is-danger",
    expired: "is-warning",
  }

  return c.render(
    <div class="section">
      <title>{t`Document number links - WüSpace DMS`}</title>
      <h1 class="title is-2">{t`Document number links`}</h1>
      <p class="subtitle is-5">
        {t`Create a one-time link that allows any user to archive a document under a specific document number, even without access to its folder.`}
      </p>
      <div class="card block">
        <header class="card-header">
          <h2 class="card-header-title">{t`Create a new link`}</h2>
        </header>
        <form
          method="post"
          action="/asn-links"
          class={cx(
            "card-content",
            css`
              display: flex;
              flex-wrap: wrap;
              align-items: flex-end;
              gap: 1rem;
              .field {
                margin-bottom: 0;
              }
              .asn-link-form__asn {
                flex: 1 1 16rem;
              }
            `,
          )}
          data-validate
        >
          <div class="asn-link-form__asn">
            <ASNField required data-validator="archive-asn" />
          </div>
          <div class="field">
            <label class="label" for="ttlDays">{t`Valid for`}</label>
            <div class="control">
              <div class="select">
                <select name="ttlDays" id="ttlDays">
                  {TTL_OPTIONS_DAYS.map((days) => (
                    <option value={days} selected={days === DEFAULT_TTL_DAYS}>
                      {t`${days} days`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div class="field">
            <button class="button is-primary" type="submit">
              {t`Create link`}
            </button>
          </div>
        </form>
      </div>
      <h2 class="title is-4">{t`Your links`}</h2>
      {asnLinks.length === 0
        ? (
          <div class="notification">
            {t`You have not created any links yet.`}
          </div>
        )
        : (
          <div class="table-container">
            <table
              class={cx(
                "table is-fullwidth is-hoverable",
                css`
                  td, th {
                    vertical-align: middle;
                  }
                  td {
                    height: 3.5rem;
                  }
                `,
              )}
            >
              <thead>
                <tr>
                  <th>{c.var.config.asnPrefix}</th>
                  <th>{t`Status`}</th>
                  <th>{t`Expires`}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {asnLinks.map((link) => {
                  const status = getAsnLinkStatus(link)
                  const folder = getFolderInformation(link.asn, c.var.config)
                  const register = getRegisterInformation(
                    link.asn,
                    c.var.config,
                  )
                  return (
                    <tr key={link.id}>
                      <td>
                        <strong>
                          {c.var.config.asnPrefix}&nbsp;{link.asn}
                        </strong>
                        {folder && (
                          <p class="is-size-7 has-text-grey">
                            {folder.label}
                            {register && ` › ${register.register}`}
                          </p>
                        )}
                      </td>
                      <td>
                        <span class={`tag ${statusColors[status]}`}>
                          {statusLabels[status]}
                        </span>
                      </td>
                      <td>
                        <DateDisplay date={link.expiresAt} />
                      </td>
                      <td class="has-text-right">
                        {status === "valid" && (
                          <ActionButton
                            method="post"
                            action={`/asn-links/${link.id}/revoke`}
                            color="danger"
                            small
                            confirm={t`Are you sure you want to revoke this link? It will stop working immediately.`}
                          >
                            {t`Revoke`}
                          </ActionButton>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
    </div>,
  )
})

asnLinksRouter.post("/", async (c) => {
  const form = await c.req.parseBody()
  const parsed = z.object({
    asn: z.string().trim().min(1).max(32),
    ttlDays: z.coerce.number().refine((d) => TTL_OPTIONS_DAYS.includes(d))
      .default(DEFAULT_TTL_DAYS),
  }).safeParse(form)

  if (!parsed.success) {
    throw new LocalizedHttpException({
      status: 400,
      technicalMessage: "Invalid ASN link request",
      localizedTitle: lt`Invalid request`,
      localizedMessage:
        lt`The provided document number or validity period is invalid.`,
      cause: parsed.error,
    })
  }
  const { asn, ttlDays } = parsed.data

  const forbidden = (message: string) =>
    new LocalizedHttpException({
      status: 400,
      technicalMessage: message,
      localizedTitle: lt`Cannot create link`,
      localizedMessage:
        lt`You can only create links for existing folders and registers, for document numbers you have write access to, and that have not been archived yet.`,
    })

  if (
    !getFolderInformation(asn, c.var.config) ||
    !getRegisterInformation(asn, c.var.config)
  ) {
    throw forbidden("Unknown folder or register")
  }

  const archived = new ArchivedDocumentModel(c.var.db, c.var.user, c.var.config)
  if (!archived.hasASNPermission(asn, true)) {
    throw forbidden("User cannot write to ASN")
  }
  const [isArchived, isArchivedError] = await archived.isASNArchived(asn)
  if (isArchivedError) {
    throw internalError("Failed to check ASN archival", isArchivedError)
  }
  if (isArchived) throw forbidden("ASN already archived")

  const links = new AsnLinkModel(c.var.db, c.var.user)
  const [created, createError] = await links.create(asn, ttlDays)
  if (createError) throw internalError("Failed to create ASN link", createError)

  getLogger("asn-links").withContext({
    userId: c.var.user.id,
    asnLinkId: created.link.id,
    asn,
  }).info("Created ASN link.")

  const url = new URL(c.req.url)
  const proto = c.req.header("x-forwarded-proto") ??
    url.protocol.replace(":", "")
  const host = c.req.header("x-forwarded-host") ?? url.host
  const redeemUrl = `${proto}://${host}/asn-links/redeem/${created.token}`

  return c.render(
    <div class="section">
      <title>{t`Document number link created - WüSpace DMS`}</title>
      <h1 class="title is-2">{t`Link created`}</h1>
      <div class="notification is-success is-light">
        {t`Share this link with the person who should archive a document as ${c.var.config.asnPrefix} ${asn}. It can be used once and is valid until ${
          created.link.expiresAt.toISOString().substring(0, 10)
        }. For security reasons, it will not be shown again.`}
      </div>
      <div class="field">
        <input
          class="input"
          type="text"
          readonly
          value={redeemUrl}
          onfocus="this.select()"
        />
      </div>
      <a class="button is-primary" href="/asn-links">{t`Back to your links`}</a>
    </div>,
  )
})

asnLinksRouter.post("/:id/revoke", async (c) => {
  const links = new AsnLinkModel(c.var.db, c.var.user)
  const [_result, error] = await links.revoke(c.req.param("id"))
  if (error) {
    throw new LocalizedHttpException({
      status: 404,
      technicalMessage: "Failed to revoke ASN link",
      localizedTitle: lt`Cannot revoke link`,
      localizedMessage:
        lt`The link does not exist, was not created by you, or has already been used or revoked.`,
      cause: error,
    })
  }
  return c.redirect("/asn-links")
})

asnLinksRouter.get("/redeem/:token", async (c) => {
  const token = c.req.param("token")
  const links = new AsnLinkModel(c.var.db, c.var.user)
  const [link, linkError] = await links.findValidByToken(token)
  if (linkError) {
    throw new LocalizedHttpException({
      status: 410,
      technicalMessage: "ASN link is invalid",
      localizedTitle: lt`Link not valid`,
      localizedMessage:
        lt`This link is invalid, has expired, has already been used, or was revoked. Please ask the person who created it for a new one.`,
      cause: linkError,
    })
  }

  const archived = new ArchivedDocumentModel(c.var.db, c.var.user, c.var.config)
  const [isArchived] = await archived.isASNArchived(link.asn)
  if (isArchived) {
    throw new LocalizedHttpException({
      status: 410,
      technicalMessage: "ASN already archived",
      localizedTitle: lt`Link not valid`,
      localizedMessage:
        lt`A document has already been archived under this number.`,
    })
  }

  const inbox = new InboxDocumentModel(c.var.db, c.var.user)
  const [inboxDocuments, inboxError] = await inbox.get()
  if (inboxError) throw internalError("Failed to get inbox", inboxError)

  return c.render(
    <div class="section">
      <title>{t`Archive a document - WüSpace DMS`}</title>
      <h1 class="title is-2">
        {t`Archive a document as ${c.var.config.asnPrefix} ${link.asn}`}
      </h1>
      <p class="subtitle is-4">
        {t`Select the document from your inbox that you want to archive under this number. If you have not uploaded it yet, upload it below and reload this page once it has been processed.`}
      </p>
      <FileUpload />
      <DocumentGrid
        noDocumentsFoundMessage={t`There are no documents in your inbox. Upload some files to get started or wait for uploaded files to finish processing.`}
      >
        {inboxDocuments.map((doc) => (
          <DocumentCard
            doc={doc}
            asnPrefix={c.var.config.asnPrefix}
            href={`/inbox/${doc.id}?asnLink=${encodeURIComponent(token)}`}
          />
        ))}
      </DocumentGrid>
    </div>,
  )
})
