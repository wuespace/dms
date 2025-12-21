import { Hono } from "@hono/hono"
import { validator } from "@hono/hono/validator"
import { LocalizedHttpException, t } from "@wuespace/honolate"
import z from "@zod/zod"
import { getLogger } from "../../log.ts"
import {
  getFolderInformation,
  getRegisterInformation,
} from "../../model/asn-configuration.ts"
import { ArchivedDocumentModel } from "../../model/documents/ArchivedDocument.ts"
import { getVisibleTags, parseTags } from "../../model/tags.ts"
import { withConfig } from "../middleware/with-config.ts"
import { withDB } from "../middleware/with-db.ts"
import { withUser } from "../middleware/with-user.tsx"

export const validatorValidator = validator("json", (x: unknown) => {
  return z.object({ value: z.string() }).parse(x) as { value: string }
})

export const uiSupportRouter = new Hono()
  .use(withConfig)
  .use(withUser)
  .use(withDB)
  // MARK: /__/status
  .get("/status", (c) => {
    return c.json({
      status: "ok",
    })
  })
  // MARK: /__/tags
  // Returns the list of tags visible to the current user.
  // Useful for populating tag selection UIs.
  .get("/tags", async (c) => {
    const [tags, fetchTagsError] = await getVisibleTags(
      c.var.user,
      c.var.config,
      c.var.db,
    )
    if (fetchTagsError) {
      getLogger().withError(fetchTagsError).error(
        "Failed to fetch tags from database.",
      )
      // Return an empty list on error to avoid breaking the UI
      return c.json({ tags: [] }, 500)
    }
    return c.json({
      tags: tags,
    })
  })
  // MARK: Client Side Validators
  // These validators are used by the async-form-validation module on the client side.
  // They validate form inputs asynchronously before form submission.
  //
  // Each validation should, additionally, be performed on the server side when processing the form.
  // The client-side validation is only for better UX.
  //
  // HTTP Status Codes used:
  // - 200: OK, validation passed (body gets ignored)
  // - 202: Accepted, validation passed but needs confirmation (body contains confirmation message)
  // - 400: Bad Request, validation failed (body contains error message)
  // - 403: Forbidden, user does not have permission (body contains error message)
  // - 500: Internal Server Error, validation could not be performed (body contains error message)
  //
  // This follows a hypermedia-like approach where the response body contains the message to be shown to the user.
  // This makes it especially easy to localize the messages and change them without touching the client-side code.
  .onError((err, c) => {
    const localizedHttpError = new LocalizedHttpException({
      technicalMessage: "Unhandled error in UI support validator router.",
      status: 500,
      cause: err,
    })
    getLogger().withError(localizedHttpError).error(
      "Unhandled error in UI support router.",
    )
    return c.text(
      t`An internal server error occurred while processing the request. Please try again later. (${localizedHttpError.errorId})`,
      500,
    )
  })
  // MARK: /__/validator/archive-asn
  // data-validator="archive-asn"
  .post("/validator/archive-asn", validatorValidator, async (c) => {
    const asn = c.req.valid("json").value
    const model = new ArchivedDocumentModel(c.var.db, c.var.user, c.var.config)

    if (!asn.trim()) {
      return c.text(
        t`The ${c.var.config.asnPrefix} number cannot be empty.`,
        400,
      )
    }

    const folder = getFolderInformation(asn, c.var.config)
    if (!folder) {
      return c.text(
        t`No folder matching ${c.var.config.asnPrefix} ${asn} exists.`,
        400,
      )
    }
    const register = getRegisterInformation(asn, c.var.config)
    if (!register) {
      return c.text(
        t`No register matching ${c.var.config.asnPrefix} ${asn} exists in the folder ${c.var.config.asnPrefix} ${folder.prefix}: ${folder.label}.`,
        400,
      )
    }

    const isAllowed = model.hasASNPermission(asn, true)
    if (!isAllowed) {
      return c.text(
        t`You do not have permission to archive documents in the folder ${c.var.config.asnPrefix} ${folder.prefix}: ${folder.label}.`,
        403,
      )
    }

    const [isArchived, isArchivedError] = await model.isASNArchived(asn)
    if (isArchivedError) {
      getLogger().withError(isArchivedError).error(
        "Failed to validate ASN archival status.",
      )
      return c.text(
        t`Failed to validate ASN: ${isArchivedError.message}`,
        500,
      )
    }
    if (isArchived) {
      return c.text(
        t`A document with the number ${c.var.config.asnPrefix} ${asn} has already been archived.`,
        400,
      )
    }

    return c.text("Valid ASN.", 200)
  })
  // MARK: /__/validator/archive-tags
  // data-validator="archive-tags"
  .post("/validator/archive-tags", validatorValidator, (c) => {
    const value = c.req.valid("json").value
    const [tags, parseTagsError] = parseTags(value)
    if (parseTagsError) {
      // forward to error handling middleware
      throw parseTagsError
    }
    if (c.var.config.publicTags.some((tag) => tags.includes(tag))) {
      // 202 = Accepted (needs confirmation)
      return c.text(
        t`You have selected at least one public tag. Documents with public tags are visible to all users. Please confirm that you want to proceed.`,
        202,
      )
    }
    return c.text("All tags are valid.", 200)
  })
  // MARK: /__/validator/trigger-confirmation
  // data-validator="trigger-confirmation"
  //
  // This validator is used to trigger a confirmation dialog before archiving a document.
  // To use it, add a hidden input with the data-validator="trigger-confirmation" attribute.
  // The confirmation message should be provided as the value of the input.
  // For example: <input
  //   type="hidden"
  //   data-validator="trigger-confirmation"
  //   value={t`Are you sure you want to archive this document? Archived documents cannot be modified later.`}
  // />
  .post("/validator/trigger-confirmation", async (c) => {
    const { value } = await c.req.json()
    if (!value || typeof value !== "string" || value.trim().length === 0) {
      getLogger().withMetadata({ value }).warn(
        "No value provided for confirmation trigger.",
      )
      return c.text(
        t`Internal server error while validating the form.`,
        500,
      )
    }

    return c.text(value, 202)
  })
