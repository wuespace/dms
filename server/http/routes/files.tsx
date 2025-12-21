import { Hono } from "@hono/hono"
import { createMiddleware } from "@hono/hono/factory"
import { PropsWithChildren } from "@hono/hono/jsx"
import { useRequestContext } from "@hono/hono/jsx-renderer"
import { routePath } from "@hono/hono/route"
import { LocalizedHttpException, lt, t } from "@wuespace/honolate"
import { Config } from "../../getConfig.ts"
import { ArchivedDocumentModel } from "../../model/documents/ArchivedDocument.ts"
import { AccessList } from "../components/AccessList.tsx"
import { AccessNotification } from "../components/AccessNotification.tsx"
import { Breadcrumb, Breadcrumbs } from "../components/Breadcrumbs.tsx"
import { DocumentCard } from "../components/DocumentCard.tsx"
import { LinkCard } from "../components/link-card.tsx"
import { LinkCardGrid } from "../components/LinkCardGrid.tsx"
import { withConfig } from "../middleware/with-config.ts"
import { withDB } from "../middleware/with-db.ts"
import { withUser } from "../middleware/with-user.tsx"
import { DocumentGrid } from "../components/DocumentGrid.tsx"
import { DocumentGridLayoutSelector } from "../components/DocumentGridLayoutSelector.tsx"

export const fileRouter = new Hono()
  .use(withConfig, withUser)

fileRouter.get("/", (c) => {
  const config = c.var.config
  const folders = config.folders
  return c.render(
    <FileCabinetLayout config={config}>
      <title>{t`File Cabinet - WüSpace DMS`}</title>
      <FileBreadcrumbs />
      <div className="notification">
        <p class="mb-2">
          {t`You have the following roles, granting you access to the highlighted folders:`}
        </p>
        <div className="tags are-medium">
          {c.var.user.roles.map((role) => (
            <span key={role} class="tag is-primary">
              {role}
            </span>
          ))}
        </div>
      </div>
      <LinkCardGrid>
        {folders.flatMap((folder) => {
          if (
            /^\[(\d+)-(\d+)\]$/.test(folder.prefix)
          ) {
            const [start, end] = folder.prefix.slice(1, -1).split("-")
            // Range start and end are inclusive
            const range = Array.from({
              length: parseInt(end) - parseInt(start) + 1,
            }, (_, i) => parseInt(start) + i)

            return range.map((i) => (
              <LinkCard
                title={`${config.asnPrefix} ${i}X XXX`}
                subtitle={folder.label}
                href={`/files/${i}`}
                description={
                  <AccessList
                    readOnlyRoles={folder.read}
                    readWriteRoles={folder.write}
                    ownRoles={c.var.user.roles}
                  />
                }
              />
            ))
          }

          return (
            <LinkCard
              title={`${config.asnPrefix} ${folder.prefix}X XXX`}
              subtitle={folder.label}
              href={`/files/${folder.prefix}`}
              description={
                <AccessList
                  readOnlyRoles={folder.read}
                  readWriteRoles={folder.write}
                  ownRoles={c.var.user.roles}
                />
              }
            />
          )
        })}
      </LinkCardGrid>
    </FileCabinetLayout>,
  )
})

const withFolder = createMiddleware<{
  Variables: {
    readonly config?: Config
    readonly user?: { roles: string[] }
    // Output
    readonly folder: Config["folders"][number]
    readonly hasReadAccess: boolean
    readonly hasReadWriteAccess: boolean
  }
}>(async (c, next) => {
  if (!c.var.config) {
    throw new LocalizedHttpException({
      status: 500,
      technicalMessage:
        "Configuration not loaded, but required for withFolder middleware",
    })
  }

  if (!c.var.user) {
    throw new LocalizedHttpException({
      status: 500,
      technicalMessage:
        "User not loaded, but required for withFolder middleware",
    })
  }

  const folders = c.var.config.folders
  const folderId = c.req.param("folder")

  if (!folderId) {
    throw new LocalizedHttpException({
      status: 500,
      technicalMessage:
        "No :folder parameter is present in the route, but required in withFolder middleware.",
      cause: { routePath: routePath(c) },
    })
  }
  const folder = folders.find(
    (n) => (new RegExp(`^${n.prefix}$`).test(folderId)),
  )

  if (!folder) {
    throw new LocalizedHttpException({
      status: 404,
      technicalMessage: "Folder not found",
      localizedTitle: lt`Folder not found`,
      localizedMessage:
        lt`The requested folder ${folderId} could not be found.`,
      cause: { folder, folders },
    })
  }
  c.set("folder", { ...folder, prefix: folderId })
  const userRoles = c.var.user.roles
  c.set(
    "hasReadAccess",
    folder.read.some((role) => userRoles.includes(role)),
  )
  c.set(
    "hasReadWriteAccess",
    folder.write.some((role) => userRoles.includes(role)),
  )

  await next()
})

const withRegister = createMiddleware<{
  Variables: {
    // Input
    readonly config?: Config
    readonly folder?: Config["folders"][number]
    // Output
    readonly registerLabel: string
    readonly registerPrefix: string
    readonly folderPrefix: string
  }
}>(async (c, next) => {
  if (!c.var.config) {
    throw new LocalizedHttpException({
      status: 500,
      technicalMessage:
        "Configuration not loaded, but required for withRegister middleware",
    })
  }

  if (!c.var.folder) {
    throw new LocalizedHttpException({
      status: 500,
      technicalMessage:
        "Folder not loaded, but required for withRegister middleware",
    })
  }

  const registerPrefix = c.req.param("register")

  if (!registerPrefix) {
    throw new LocalizedHttpException({
      status: 500,
      technicalMessage:
        "No :register parameter is present in the route, but required in withRegister middleware.",
      cause: { routePath: routePath(c) },
    })
  }

  const register = c.var.folder.registers[registerPrefix]

  if (!register) {
    throw new LocalizedHttpException({
      status: 404,
      technicalMessage: "Register not found",
      localizedTitle: lt`Register not found`,
      localizedMessage:
        lt`The requested register ${registerPrefix} could not be found in the folder.`,
      cause: { registerPrefix, folder: c.var.folder },
    })
  }

  c.set("registerLabel", register)
  c.set("registerPrefix", registerPrefix)
  c.set("folderPrefix", c.var.folder.prefix + registerPrefix)

  await next()
})

fileRouter.get("/:folder", withFolder, (c) => {
  return c.render(
    <FileCabinetLayout config={c.var.config}>
      <title>{t`${c.var.folder.label} - WüSpace DMS`}</title>
      <FileBreadcrumbs
        segments={[[c.var.folder.label, c.var.folder.prefix]]}
      />
      <AccessNotification
        hasReadAccess={c.var.hasReadAccess}
        hasReadWriteAccess={c.var.hasReadWriteAccess}
      />
      <LinkCardGrid>
        {Object.entries(c.var.folder.registers).map(
          ([prefix, label]) => (
            <LinkCard
              title={`${c.var.config.asnPrefix} ${c.var.folder.prefix}${prefix} XXX`}
              subtitle={label}
              href={`/files/${c.var.folder.prefix}/${prefix}`}
            />
          ),
        )}
      </LinkCardGrid>
    </FileCabinetLayout>,
  )
})

fileRouter.get(
  "/:folder/:register",
  withDB,
  withFolder,
  withRegister,
  async (c) => {
    const archivedDocsRepo = new ArchivedDocumentModel(
      c.var.db,
      c.var.user,
      c.var.config,
    )
    const [docs, getDocsError] = await archivedDocsRepo.get({
      asn: { $regex: `^${c.var.folderPrefix}` },
    })
    if (getDocsError) {
      throw new LocalizedHttpException({
        status: 500,
        technicalMessage: "Error fetching documents",
        localizedTitle: lt`Error fetching documents`,
        localizedMessage:
          lt`An error occurred while fetching the documents. Please try again later or contact support.`,
        cause: getDocsError,
      })
    }
    return c.render(
      <FileCabinetLayout config={c.var.config}>
        <title>{t`${c.var.registerLabel} - WüSpace DMS`}</title>
        <FileBreadcrumbs
          segments={[[
            c.var.folder.label,
            c.var.folder.prefix,
          ], [
            c.var.registerLabel,
            c.var.registerPrefix,
          ]]}
        />
        <AccessNotification
          hasReadAccess={c.var.hasReadAccess}
          hasReadWriteAccess={c.var.hasReadWriteAccess}
        />
        <DocumentGrid
          noDocumentsFoundMessage={t`There are no documents in this register you have access to.`}
        >
          {docs.map((doc) => (
            <DocumentCard
              doc={doc}
              asnPrefix={c.var.config.asnPrefix}
              href="/archived/:asn"
            />
          ))}
        </DocumentGrid>
        {!!docs.length && <DocumentGridLayoutSelector />}
      </FileCabinetLayout>,
    )
  },
)

/**
 * Layout component for the File Cabinet pages.
 */
function FileCabinetLayout(
  { children, config }: PropsWithChildren<{ config: Config }>,
) {
  return (
    <div class="section">
      <h1 class="title is-2">{t`File Cabinet`}</h1>
      <p className="subtitle is-4">
        {t`Documents sorted by their ${config.asnPrefix} number`}
      </p>
      <p class="block">
        {t`Here you can see all your archived documents, sorted by their ${config.asnPrefix} number.`}
      </p>
      {children}
    </div>
  )
}

/**
 * Breadcrumbs for the File Cabinet pages.
 */
function FileBreadcrumbs({ segments }: { segments?: [string, string][] }) {
  segments ??= []

  return (
    <Breadcrumbs>
      <Breadcrumb active={segments.length === 0} href="/files">
        {useRequestContext().var.config?.asnPrefix}
      </Breadcrumb>

      {segments.map(([segmentLabel, prefix], i) => {
        return (
          <Breadcrumb
            active={i === segments.length - 1}
            href={`/files/${
              segments
                .map((s) => s[1])
                .slice(0, i + 1)
                .join("/")
            }`}
          >
            {prefix} - {segmentLabel}
          </Breadcrumb>
        )
      })}
    </Breadcrumbs>
  )
}
