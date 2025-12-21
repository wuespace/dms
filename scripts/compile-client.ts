import * as esbuild from "https://deno.land/x/esbuild@v0.25.10/mod.js"
import { denoPlugins } from "@luca/esbuild-deno-loader"

import { dirname, resolve } from "@std/path"

const INPUT_PATH = resolve("client/client.ts")
const OUTPUT_PATH = resolve("static/dist/client.js")
const OUTPUT_DIR = dirname(OUTPUT_PATH)

console.log("Building client script...")

const buildResult = await esbuild.build({
  plugins: [...denoPlugins()],
  entryPoints: [INPUT_PATH],
  outdir: OUTPUT_DIR,
  write: true,
  bundle: true,
  metafile: true,
  platform: "browser",
  format: "esm",
  target: "esnext",
  minify: true,
  sourcemap: true,
  treeShaking: true,
  legalComments: "eof",
})

if (buildResult.errors.length > 0) {
  console.error("Build errors:")
  for (const error of buildResult.errors) {
    console.error(error)
  }
  Deno.exit(1)
}

buildResult.warnings.forEach((warning) => {
  console.warn(warning)
})

console.log("Built client script to:", OUTPUT_DIR)
Object.keys(buildResult.metafile.outputs).forEach((file) => {
  console.log("  -", file)
})

Deno.exit(0)
