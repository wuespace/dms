console.group("modules/file-upload.ts")
import * as FilePond from "npm:filepond@4.32.9"
import "npm:filepond@4.32.9/dist/filepond.min.css"

// Many thanks to Urs Grupp: https://github.com/pqina/filepond/issues/39#issuecomment-660608775
const labels_de_DE = {
  // labelIdle: 'Drag & Drop your files or <span class="filepond--label-action"> Browse </span>'
  labelIdle:
    'Dateien ablegen oder <span class="filepond--label-action"> auswählen </span>',
  // labelInvalidField: 'Field contains invalid files',
  labelInvalidField: "Feld beinhaltet ungültige Dateien",
  // labelFileWaitingForSize: 'Waiting for size',
  labelFileWaitingForSize: "Dateigröße berechnen",
  // labelFileSizeNotAvailable: 'Size not available',
  labelFileSizeNotAvailable: "Dateigröße nicht verfügbar",
  // labelFileLoading: 'Loading',
  labelFileLoading: "Laden",
  // labelFileLoadError: 'Error during load',
  labelFileLoadError: "Fehler beim Laden",
  // labelFileProcessing: 'Uploading',
  labelFileProcessing: "Upload läuft",
  // labelFileProcessingComplete: 'Upload complete',
  labelFileProcessingComplete: "Upload abgeschlossen",
  // labelFileProcessingAborted: 'Upload cancelled',
  labelFileProcessingAborted: "Upload abgebrochen",
  // labelFileProcessingError: 'Error during upload',
  labelFileProcessingError: "Fehler beim Upload",
  // labelFileProcessingRevertError: 'Error during revert',
  labelFileProcessingRevertError: "Fehler beim Wiederherstellen",
  // labelFileRemoveError: 'Error during remove',
  labelFileRemoveError: "Fehler beim Löschen",
  // labelTapToCancel: 'tap to cancel',
  labelTapToCancel: "abbrechen",
  // labelTapToRetry: 'tap to retry',
  labelTapToRetry: "erneut versuchen",
  // labelTapToUndo: 'tap to undo',
  labelTapToUndo: "rückgängig",
  // labelButtonRemoveItem: 'Remove',
  labelButtonRemoveItem: "Entfernen",
  // labelButtonAbortItemLoad: 'Abort',
  labelButtonAbortItemLoad: "Verwerfen",
  // labelButtonRetryItemLoad: 'Retry',
  labelButtonRetryItemLoad: "Erneut versuchen",
  // labelButtonAbortItemProcessing: 'Cancel',
  labelButtonAbortItemProcessing: "Abbrechen",
  // labelButtonUndoItemProcessing: 'Undo',
  labelButtonUndoItemProcessing: "Rückgängig",
  // labelButtonRetryItemProcessing: 'Retry',
  labelButtonRetryItemProcessing: "Erneut versuchen",
  // labelButtonProcessItem: 'Upload',
  labelButtonProcessItem: "Upload",
  // labelMaxFileSizeExceeded: 'File is too large',
  labelMaxFileSizeExceeded: "Datei ist zu groß",
  // labelMaxFileSize: 'Maximum file size is {filesize}',
  labelMaxFileSize: "Maximale Dateigröße: {filesize}",
  // labelMaxTotalFileSizeExceeded: 'Maximum total size exceeded',
  labelMaxTotalFileSizeExceeded: "Maximale gesamte Dateigröße überschritten",
  // labelMaxTotalFileSize: 'Maximum total file size is {filesize}',
  labelMaxTotalFileSize: "Maximale gesamte Dateigröße: {filesize}",
  // labelFileTypeNotAllowed: 'File of invalid type',
  labelFileTypeNotAllowed: "Dateityp ungültig",
  // fileValidateTypeLabelExpectedTypes: 'Expects {allButLastType} or {lastType}',
  fileValidateTypeLabelExpectedTypes:
    "Erwartet {allButLastType} oder {lastType}",
  // imageValidateSizeLabelFormatError: 'Image type not supported',
  imageValidateSizeLabelFormatError: "Bildtyp nicht unterstützt",
  // imageValidateSizeLabelImageSizeTooSmall: 'Image is too small',
  imageValidateSizeLabelImageSizeTooSmall: "Bild ist zu klein",
  // imageValidateSizeLabelImageSizeTooBig: 'Image is too big',
  imageValidateSizeLabelImageSizeTooBig: "Bild ist zu groß",
  // imageValidateSizeLabelExpectedMinSize: 'Minimum size is {minWidth} × {minHeight}',
  imageValidateSizeLabelExpectedMinSize:
    "Mindestgröße: {minWidth} × {minHeight}",
  // imageValidateSizeLabelExpectedMaxSize: 'Maximum size is {maxWidth} × {maxHeight}',
  imageValidateSizeLabelExpectedMaxSize:
    "Maximale Größe: {maxWidth} × {maxHeight}",
  // imageValidateSizeLabelImageResolutionTooLow: 'Resolution is too low',
  imageValidateSizeLabelImageResolutionTooLow: "Auflösung ist zu niedrig",
  // imageValidateSizeLabelImageResolutionTooHigh: 'Resolution is too high',
  imageValidateSizeLabelImageResolutionTooHigh: "Auflösung ist zu hoch",
  // imageValidateSizeLabelExpectedMinResolution: 'Minimum resolution is {minResolution}',
  imageValidateSizeLabelExpectedMinResolution:
    "Mindestauflösung: {minResolution}",
  // imageValidateSizeLabelExpectedMaxResolution: 'Maximum resolution is {maxResolution}'
  imageValidateSizeLabelExpectedMaxResolution:
    "Maximale Auflösung: {maxResolution}",
}
;(function () {
  const inputs = document.querySelectorAll<HTMLInputElement>(
    "input[type=file].file-upload",
  )

  if (inputs.length === 0) {
    console.debug("No file uploads found.")
    return
  }

  console.debug(
    "This application uses the FilePond library: https://pqina.nl/filepond/",
  )

  inputs.forEach((input) => {
    const allowMultiple = !!input.multiple

    console.debug(
      "Initializing file upload:",
      input,
      "(multiple:",
      allowMultiple,
      ")",
    )

    FilePond.create(input, {
      credits: false, // handled by the console message
      allowMultiple: allowMultiple,
      name: "files",
      ...(document.documentElement.lang === "de" ? { ...labels_de_DE } : {}),
      server: {
        process: "./upload", // POST to /upload
        fetch: null, // disable fetching the uploaded file
        revert: null, // disable reverting the upload from the form
      },
    })
  })

  console.info("File uploads initialized.")
})()

console.groupEnd()
