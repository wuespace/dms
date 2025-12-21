import { validator } from "@hono/hono/validator"
import { LocalizedHttpException, lt } from "@wuespace/honolate"
import { z } from "@zod/zod"
import { parseTags } from "../../model/tags.ts"

export const searchQueryParamsValidator = validator("query", (value) => {
  const { success, error, data } = z.object({
    asn: z.string().optional(),
    q: z.string().default(""),
    title: z.string().default(""),
    tags: z.string().optional(),
  }).safeParse(value)

  if (!success) {
    throw new LocalizedHttpException({
      status: 400,
      technicalMessage: "Invalid search query parameters",
      localizedTitle: lt`Invalid search query parameters`,
      localizedMessage:
        lt`The provided search query parameters are invalid. Please check the input and try again.`,
      cause: error,
    })
  }

  const [tags, tagsError] = parseTags(value.tags ?? [])
  if (tagsError) {
    throw new LocalizedHttpException({
      status: 400,
      technicalMessage: "Invalid tags",
      localizedTitle: lt`Invalid tags`,
      localizedMessage:
        lt`The provided search tags are invalid. Please check the input and try again.`,
      cause: tagsError,
    })
  }

  return {
    ...data,
    tags,
  }
})
