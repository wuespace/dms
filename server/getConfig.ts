import { z } from "@zod/zod"
import { parse } from "@std/yaml"
import { EnvNotSetError } from "@wuespace/envar"
import { tagSchema } from "./model/tags.ts"
import { Result, wrap } from "./result.ts"

const asnPrefixSchema = z.string().min(1).max(10).toUpperCase()
const asnGeneratorUrlSchema = z.string().url().optional()

const groupNameSchema = z.coerce.string().min(1).max(512)
const labelSchema = z.string().min(1).max(512)
const prefixSchema = z.coerce.string().min(1).max(50)

const folderSchema = z.object({
  prefix: prefixSchema,
  label: labelSchema,
  read: groupNameSchema.array().default([]),
  write: groupNameSchema.array().default([]),
  registers: z.record(z.string(), labelSchema),
})

const configSchema = z.object({
  publicTags: tagSchema.array().default([]),
  asnPrefix: asnPrefixSchema,
  asnGeneratorUrl: asnGeneratorUrlSchema,
  folders: folderSchema.array(),
})

let config: z.infer<typeof configSchema>

export type Config = z.infer<typeof configSchema>

export function getConfig(
  refresh = false,
): Result<z.infer<typeof configSchema>, Error> {
  if (!config || refresh) {
    const [loadedConfig, loadError] = loadConfig()
    if (loadError) {
      return [null, loadError]
    }
    config = loadedConfig
  }
  return [config, null]
}

function loadConfig(): Result<Config, Error> {
  const configYamlText = Deno.env.get("CONFIG")
  if (!configYamlText) {
    return [
      null,
      new EnvNotSetError("CONFIG"),
    ]
  }

  const [parsedYaml, parseYamlError] = wrap(() => parse(configYamlText))
  if (parseYamlError) {
    return [null, parseYamlError]
  }

  const { data, error } = configSchema.safeParse(parsedYaml)

  if (error) {
    return [
      null,
      new Error("Could not parse configuration.", { cause: error }),
    ]
  }
  return [data, null]
}
