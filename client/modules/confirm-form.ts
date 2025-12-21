/// <reference lib="dom" />

/**
 * @module confirm-form
 *
 * This module initializes forms with a confirmation message before submitting.
 *
 * Use the `data-confirm` attribute on a form to set the confirmation message.
 * If the user confirms the message, the form will be submitted.
 * If the user cancels the message, the form will not be submitted.
 *
 * If no confirmation message is set, the form will be submitted without asking.
 */

console.group("modules/confirm-form.ts")
;(function () {
  const inputs = document.querySelectorAll("form[data-confirm]")

  if (inputs.length === 0) {
    console.debug("No forms with confirmation messages found.")
    return
  }

  inputs.forEach((form) => {
    console.debug("Initializing confirmation form:", form)

    form.addEventListener("submit", (event) => {
      const confirmMessage = form.getAttribute("data-confirm")

      if (!confirmMessage || confirm(confirmMessage)) {
        return
      }

      event.preventDefault()
    })
  })

  console.info("Confirmation forms initialized.")
})()

console.groupEnd()
