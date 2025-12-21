import { AsyncResult } from "../result.ts"
import { existsSync } from "node:fs"
import { cp } from "node:fs/promises"
import { modifyFilePath } from "./modifyFilePath.ts"
import { monotonicUlid } from "@std/ulid/monotonic-ulid"
import { GotenbergError } from "./GotenbergError.ts"

/**
 * Converts a given file to PDF.
 * @param src the source file
 * @returns the path to the converted file
 */
export async function convertToPDF(
  src: string,
): Promise<
  AsyncResult<string, AlreadyExistsError | GotenbergError | FileWriterError>
> {
  const dest = modifyFilePath(src, monotonicUlid(), "pdf")

  if (existsSync(dest)) {
    // Don't "reprocess" files
    return [
      null,
      new AlreadyExistsError("Destination file already exists: " + dest),
    ]
  }

  if (src.endsWith(".pdf")) {
    // If it's already a PDF, we don't need Gotenberg.
    await cp(src, dest)
    return [dest, null]
  }

  const fd = new FormData()
  fd.append("files", new Blob([await Deno.readFile(src)]), src)

  const res = await fetch("http://gotenberg:3000/forms/libreoffice/convert", {
    method: "POST",
    body: fd,
  })

  if (!res.ok) {
    const details = await res.text()
    const status = res.statusText
    return [
      null,
      new GotenbergError(
        `Failed to convert PDF using Gotenberg.\n` +
          `Gotenberg responded with "${status}". Additional Details:\n` +
          details,
      ),
    ]
  }

  if (!res.body) {
    return [null, new GotenbergError("Gotenberg returned without a body")]
  }

  return pipeToFile(res.body, dest)
}

/**
 * Writes the contents of a {@link ReadableStream} to a file path.
 * @param stream the readable stream that should get saved to the file
 * @param dest the path to the file destination
 * @returns the path to the destination file
 */
async function pipeToFile(
  stream: ReadableStream<Uint8Array>,
  dest: string,
): AsyncResult<string, FileWriterError> {
  try {
    using file = await Deno.open(dest, {
      create: true,
      write: true,
      truncate: true,
    })

    await stream.pipeTo(file.writable)
    return [dest, null]
  } catch (e: unknown) {
    return [
      null,
      new FileWriterError("Couldn't write output file. Details:\n" + e),
    ]
  }
}

/**
 * An error that occurred while writing the file.
 */
export class FileWriterError extends Error {
  readonly type = "FileWriterError"
}
/**
 * Error that occurs when the destination file already exists.
 */
export class AlreadyExistsError extends Error {
  readonly type = "AlreadyExistsError"
}
