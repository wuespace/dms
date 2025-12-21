#!/usr/bin/env -S deno run --allow-read --allow-write=./locales/ --allow-env
import { initHonolate, InitHonolateOptions, runCLI } from "@wuespace/honolate"

const config = {
  defaultLanguage: "en",
  languages: {
    en: import.meta.resolve("./locales/en.json"),
    de: import.meta.resolve("./locales/de.json"),
  },
} satisfies InitHonolateOptions<string>

// CLI
import.meta.main && await runCLI(config, import.meta.dirname ?? Deno.cwd())

// Middleware for Hono
export const i18n = await initHonolate(config)
