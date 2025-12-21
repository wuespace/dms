import { monotonicUlid } from "@std/ulid/monotonic-ulid"
import { AsyncResult } from "../result.ts"
import { modifyFilePath } from "./modifyFilePath.ts"

/**
 * Generates images from a PDF file's first page
 * @param pdfPath the path to a PDF file to generate images from
 * @returns paths to the generated images:
 * - `[0]` a 300dpi fullsize image,
 * - `[1]` a 512x512px thumbnail,
 * - `[2]` a 1024x1024px retina thumbnail
 */
export async function generateImages(
  pdfPath: string,
): AsyncResult<
  [fullsize: string, thumbnail: string, retinaThumbnail: string],
  ImageMagickError
> {
  const fullSizeDestination = modifyFilePath(pdfPath, monotonicUlid(), "jpg")
  const thumbnailDestination = modifyFilePath(pdfPath, monotonicUlid(), "jpg")
  const retinaThumbnailDestination = modifyFilePath(
    pdfPath,
    monotonicUlid(),
    "jpg",
  )

  const imageMagickProcess = new Deno.Command("convert", {
    args: [
      "-density",
      "300",
      "-background",
      "white",
      "-colorspace",
      "sRGB",
      `${pdfPath}[0]`,
      "-flatten",
      "-write",
      fullSizeDestination,
      "-resize",
      "1024x1024",
      "-write",
      retinaThumbnailDestination,
      "-resize",
      "512x512",
      thumbnailDestination,
    ],
    stdout: "piped",
  })

  const executionResult = await imageMagickProcess.output()
  if (!executionResult.success) {
    const textDecoder = new TextDecoder()
    const stderr = textDecoder.decode(executionResult.stderr)
    return [
      null,
      new ImageMagickError(
        "Failed to generate images from PDF. magick failed with Status Code: " +
          executionResult.code + ". Details:\n" + stderr,
      ),
    ]
  }

  return [[
    fullSizeDestination,
    thumbnailDestination,
    retinaThumbnailDestination,
  ], null]
}

export class ImageMagickError extends Error {
  public readonly type = "ImageMagickError"
}
