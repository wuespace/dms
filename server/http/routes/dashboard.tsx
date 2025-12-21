import { Hono } from "@hono/hono"
import { css } from "@hono/hono/css"
import { FileUpload } from "../components/FileUpload.tsx"
import { withUser } from "../middleware/with-user.tsx"
import { LinkCard } from "../components/link-card.tsx"
import { withConfig } from "../middleware/with-config.ts"
import { t } from "@wuespace/honolate"

export const dashboardRouter = new Hono()
  .use(withUser, withConfig)

dashboardRouter
  .get("/", (c) =>
    c.render(
      <div class="section">
        <title>{t`Dashboard - WüSpace DMS`}</title>
        <h1 className="title is-1">
          {t`WüSpace DMS`}
        </h1>
        <p className="subtitle is-3">
          {t`Welcome to the Document Management System, ${c.var.user.name}!`}
        </p>
        <div className="block">
          <p>
            {t`You are logged in with the following roles:`}
          </p>
          <div class="tags are-medium">
            {c.var.user.roles.map((role) => (
              <span className="tag" key={role}>{role}</span>
            ))}
          </div>
        </div>
        <p class="block">
          {t`Note that the permissions depend on the roles you have. You may not be able to see all the features.`}
        </p>
        <p className="block">
          {t`Your (${c.var.user.name}'s) user ID is ${(
            <code>{c.var.user.id}</code>
          )}.`}
        </p>
        {c.var.config.asnGeneratorUrl && (
          <LinkCard
            title={t`Generate document (${c.var.config.asnPrefix}) numbers`}
            subtitle={t`Before you can archive documents using the DMS, you need to generate unique document numbers for them. Follow this link to generate some.`}
            target="_blank"
            href={c.var.config.asnGeneratorUrl}
          />
        )}
        <div className="panel">
          <h2 className="panel-heading">
            {t`Upload a document`}
          </h2>
          <p className="panel-block">
            {t`You can upload a document here. After it got processed, it will appear in your inbox.`}
          </p>
          <div className="panel-block">
            <div
              class={css`
                width: 100%;
              `}
            >
              <FileUpload />
            </div>
          </div>
        </div>
      </div>,
    ))
