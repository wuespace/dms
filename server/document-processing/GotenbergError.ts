/**
 * A Gotenberg-internal error that occurred while converting the file to PDF.
 */
export class GotenbergError extends Error {
  readonly type = "GotenbergError"
}
