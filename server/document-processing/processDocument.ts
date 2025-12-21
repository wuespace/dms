import { redactContent } from "../document-lifecycle/util/redact.ts"
import { getLogger } from "../log.ts"
import { AsyncResult } from "../result.ts"
import { convertToPDF } from "./convertToPdf.ts"
import { copyToTempDir } from "./copyToTempDir.ts"
import { DocumentProcessingResult } from "./DocumentProcessingResult.ts"
import { extractCodes } from "./extractCodes.ts"
import { extractDateFromContent } from "./extractDateFromContent.ts"
import { extractPDFMetadata } from "./extractPDFMetadata.ts"
import { generateImages } from "./generateImages.ts"
import { getASNFromCodes } from "./getASNFromCodes.ts"
import { getPDFText } from "./getPDFText.ts"
import { ocrPDF } from "./ocrPDF.ts"

export async function processDocument(
  originalPath: string,
): AsyncResult<DocumentProcessingResult, Error> {
  const logger = getLogger("processDocument").withContext({ originalPath })
  logger.debug("Starting document processing.")
  const [originalFilePath, copyTempDirError] = await copyToTempDir(
    originalPath,
  )
  logger.withContext({ originalFilePath })
  if (copyTempDirError) {
    logger.withError(copyTempDirError).error(
      "Failed to copy original file to temp directory.",
    )
    return [null, copyTempDirError]
  }
  const [pdfFilePath, convertToPDFError] = await convertToPDF(
    originalFilePath,
  )
  logger.withContext({ pdfFilePath })
  if (convertToPDFError) {
    logger.withError(convertToPDFError).error(
      "Failed to convert original file to PDF.",
    )
    return [null, convertToPDFError]
  }

  const [pdfMetadata, extractPDFMetadataError] = await extractPDFMetadata(
    pdfFilePath,
  )
  logger.withContext({ pdfMetadata })

  if (extractPDFMetadataError) {
    logger.withError(extractPDFMetadataError).error(
      "Failed to extract PDF metadata from PDF file.",
    )
    return [null, extractPDFMetadataError]
  }

  const [ocredPdfFilePath, ocrPDFError] = await ocrPDF(pdfFilePath)
  logger.withContext({ ocredPdfFilePath })
  if (ocrPDFError) {
    logger.withError(ocrPDFError).error("Failed to OCR PDF file.")
    return [null, ocrPDFError]
  }
  const [extractedTextContent, getPDFTextError] = await getPDFText(
    ocredPdfFilePath,
  )
  logger.withContext(
    { ...redactContent({ extractedTextContent }, "extractedTextContent") },
  )
  if (getPDFTextError) {
    logger.withError(getPDFTextError).error(
      "Failed to extract text from OCRed PDF file.",
    )
    return [null, getPDFTextError]
  }

  const suggestedDate = extractDateFromContent(extractedTextContent)
  logger.withContext({ suggestedDate })

  const [
    imagePaths,
    generateImagesError,
  ] = await generateImages(
    pdfFilePath,
  )
  logger.withContext({ imagePaths })
  if (generateImagesError) {
    logger.withError(generateImagesError).error(
      "Failed to generate images from PDF file.",
    )
    return [null, generateImagesError]
  }
  const [fullsizePath, thumbnailPath, retinaThumbnailPath] = imagePaths

  const [detectedCodes, extractCodesError] = await extractCodes(fullsizePath)
  logger.withContext({ detectedCodes })
  if (extractCodesError) {
    logger.withError(extractCodesError).error(
      "Failed to extract codes from generated image.",
    )
    return [null, extractCodesError]
  }

  const [suggestedASN, getASNError] = await getASNFromCodes(detectedCodes)
  logger.withContext({ suggestedASN })
  if (getASNError) {
    logger.withError(getASNError).error(
      "Failed to get ASN from detected codes.",
    )
    return [null, getASNError]
  }

  logger.debug("Document processing completed successfully.")

  return [{
    originalFilePath,
    ocredPdfFilePath,
    thumbnailPath,
    retinaThumbnailPath,
    extractedTextContent,
    detectedCodes,
    suggestedASN,
    suggestedTitle: pdfMetadata.title,
    suggestedTags: pdfMetadata.tags,
    date: suggestedDate ?? pdfMetadata.date,
  }, null]
}
