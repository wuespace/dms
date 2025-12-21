# Document Processing

This module is responsible for processing documents uploaded to the system. It
extracts text, metadata, and images from the document and runs OCR and barcode
processing on it.

## Out of Scope

This module does not interact with the database in any way. Its entrypoint is
the path to an unprocessed file and it returns the processed file paths and
extracted data.

## Pipeline

```mermaid
flowchart TD

raw[/Raw Document/]
raw --> toPdf[Convert to PDF with Gotenberg]
toPdf --> pdf[/PDF Document/]
raw-->pdf

pdf --> ocr[Run OCR on PDF using ocrmypdf]
ocr --> textPDF[/PDF Document with Text Data/]
textPDF-->result

textPDF-->extractText[Extract text with pdftotext]
extractText-->text[/Raw Text Data/]
text-->result

text-->extractDate[Extract date from text]
extractDate-->date[/Suggested Date/]
date-->result

pdf-->extractMetadata[Extract PDF Metadata]
extractMetadata-->title[/Document Title/]
title-->result
extractMetadata-->tags[/Document Tags/]
tags-->result

pdf-->convertToImages[Convert to images using magick]
convertToImages-->highResImg[/High Resolution Image of First Page/]
convertToImages-->thumbnails[/Thumbnail Images of First Page/]
thumbnails-->result

highResImg-->processCodes[Process QR-/ Barcodes with zbarimg]
processCodes-->codes[/QR-/ Barcodes contained in the Document/]
codes-->result


result[\Processing Result/]
```
