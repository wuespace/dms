/// <reference lib="dom" />
import "npm:htmx.org@2.0.8"

console.group("client.ts")
console.info("Copyright (c) " + new Date().getFullYear() + " WüSpace e. V.")
console.info("Sources: https://github.com/wuespace/dms")
console.debug("Loading modules...")
await import("./modules/tags-input.ts")
await import("./modules/file-upload.ts")
await import("./modules/confirm-form.ts")
await import("./modules/async-form-validation.ts")
console.debug("Modules loaded.")
console.groupEnd()
