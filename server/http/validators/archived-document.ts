import { validator } from "@hono/hono/validator"
import { LocalizedHttpException, lt } from "@wuespace/honolate"
import { z } from "@zod/zod"
import { parseTags } from "../../model/tags.ts"

export const archivedDocumentValidator = validator("form", (value) => {
  const { success, error, data } = z.object({
    title: z.string().min(1).max(512),
    asn: z.string().min(1).max(32),
    date: z.coerce.date(),
  }).safeParse(value)

  if (!success) {
    throw new LocalizedHttpException({
      status: 400,
      technicalMessage: "Invalid archived document metadata",
      localizedTitle: lt`Invalid archived document metadata`,
      localizedMessage:
        lt`The provided archived document metadata is invalid. Please check the input and try again.`,
      cause: error,
    })
  }

  const [tags, tagsError] = parseTags(value.tags)
  if (tagsError) {
    throw new LocalizedHttpException({
      status: 400,
      technicalMessage: "Invalid tags",
      localizedTitle: lt`Invalid tags`,
      localizedMessage:
        lt`The provided tags are invalid. Please check the input and try again.`,
      cause: tagsError,
    })
  }

  return {
    ...data,
    tags,
  }
})
