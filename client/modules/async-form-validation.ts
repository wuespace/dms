/// <reference lib="dom" />

/**
 * @module async-form-validation
 *
 * Validates form inputs asynchronously before form submission.
 *
 * Use the `data-validate` attribute on a form to enable validation.
 */

console.group("modules/async-form-validation.ts")
;(function () {
  const forms = document.querySelectorAll<HTMLFormElement>(
    "form[data-validate]",
  )

  if (forms.length === 0) {
    console.debug("No async validation forms found for validation.")
    return
  }

  forms.forEach((form) => {
    console.debug("Initializing async validation form:", form)

    const fields = form.querySelectorAll<HTMLInputElement>(
      "input[data-validator], textarea[data-validator], select[data-validator], button[data-validator]",
    )

    fields.forEach((field) => {
      field.addEventListener("input", () => {
        field.setCustomValidity("")
      })
      field.addEventListener("change", () => {
        field.setCustomValidity("")
      })
    })

    // Add a per-form isSubmitting flag
    let isSubmitting = false

    form.addEventListener("submit", async (event) => {
      event.preventDefault()

      if (isSubmitting) {
        // Prevent concurrent submissions
        return
      }
      isSubmitting = true

      // Disable all submit buttons in the form
      const submitButtons = form.querySelectorAll<HTMLButtonElement>(
        'button[type="submit"], input[type="submit"]',
      )
      submitButtons.forEach((btn) => btn.disabled = true)

      const confirms = [] as string[]

      try {
        for (const field of Array.from(fields)) {
          field.setCustomValidity("")
          const validationResult = await fetch(
            `/__/validator/${field.dataset.validator}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Accept": "text/plain",
              },
              body: JSON.stringify({
                value: field.value,
              }),
            },
          )

          if (!validationResult.ok) {
            const errorText = await validationResult.text()
            field.setCustomValidity(errorText)
            form.reportValidity()
            return
          }

          if (validationResult.status === 202) {
            const confirmText = await validationResult.text()
            confirms.push(confirmText)
          }
        }

        while (confirms.length > 0) {
          const confirmText = confirms.shift()!
          const userConfirmed = confirm(confirmText)
          if (!userConfirmed) {
            return
          }
        }

        form.submit()
      } catch (error) {
        console.error("Error during async form validation:", error)
        alert(
          "An error occurred during form validation. Please try again later.",
        )
      } finally {
        isSubmitting = false
        submitButtons.forEach((btn) => btn.disabled = false)
      }
    })
  })

  console.info("Async validation forms initialized.")
})()

console.groupEnd()
