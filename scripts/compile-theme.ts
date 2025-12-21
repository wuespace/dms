/*
Allows Bulma customization without a local `node_modules` directory.

I'm going to be honest: this is kind of dumb, but it works.

Bulma CSS customization is normally done by importing the SCSS files and
overriding variables before compiling the SCSS to CSS. This is a problem
because Deno doesn't have a local `node_modules` directory, so we can't
import the SCSS files directly.

Deno does have a function to use a `node_modules` directory, but let's
face it: doing this just to customize Bulma is overkill. Instead, we can
just use the `npm:` module to cache Bulma in Deno's cache, then compile
our own SCSS files using the cached Bulma as a load path.

Is it dumb? Yes. Does it work? Also yes.
*/

import * as sass from "sass"
import { dirname, fromFileUrl, resolve } from "@std/path"

const INPUT_PATH = resolve("theme.scss")
const OUTPUT_PATH = resolve("static/dist/theme.css")
const OUTPUT_DIR = dirname(OUTPUT_PATH)

if (import.meta.main) {
  // This script is being run directly – what a surprise!

  if (!Deno.lstatSync(INPUT_PATH).isFile) {
    console.error("Input file not found:", INPUT_PATH)
    Deno.exit(1)
  }

  const bulmaPath = await loadBulma()
  console.log("Bulma path:", bulmaPath)
  compileScss(bulmaPath)
  console.log("Compiled SCSS:", INPUT_PATH)
  console.log("Compiled to:", OUTPUT_PATH)
}

export function compileScss(bulmaPath: string) {
  // Compile SCSS using Bulma as load path
  const { css } = sass.compile("theme.scss", {
    loadPaths: [bulmaPath],
    logger: sass.Logger.silent,
    style: "compressed",
  })

  // Write compiled CSS to output file
  Deno.mkdirSync(OUTPUT_DIR, { recursive: true })
  Deno.writeTextFileSync(OUTPUT_PATH, css)
}

export async function loadBulma() {
  try {
    await import("npm:bulma@1.0.4")
  } catch {
    // Will fail because Deno can't import CSS
    // => still caches Bulma using Deno, which is what we need.
  }

  const bulmaImportUrl = import.meta.resolve("npm:bulma") // points to a .scss file
  const bulmaImportPath = fromFileUrl(bulmaImportUrl) // points to a .scss file
  const bulmaPath = dirname(bulmaImportPath) // points to the module directory
  return bulmaPath
}
