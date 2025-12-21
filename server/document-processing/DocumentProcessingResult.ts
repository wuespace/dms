export interface DocumentProcessingResult {
  originalFilePath: string
  ocredPdfFilePath: string
  thumbnailPath: string
  retinaThumbnailPath: string
  extractedTextContent: string
  detectedCodes: string[]
  suggestedASN: string
  suggestedTags: string[]
  suggestedTitle: string
  date: Date
}
