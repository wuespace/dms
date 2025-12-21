/// <reference lib="dom" />

import Tagify from "npm:@yaireo/tagify@4.35.4"
import "npm:@yaireo/tagify@4.35.4/dist/tagify.polyfills.min.js"
import "npm:@yaireo/tagify@4.35.4/dist/tagify.css"

console.group("modules/tags-input.ts")
;(async function () {
  const inputs = document.querySelectorAll("input.tags-input")

  if (inputs.length === 0) {
    console.debug("No tags inputs found.")
    return
  }

  const tagSuggestions = await fetch("/__/tags", {
    signal: AbortSignal.timeout(1000),
  })
    .then((res) => res.json())
    .catch(() => ({ tags: [] }))
    .then((data) => data.tags as string[])

  console.debug("Loaded tag suggestions:", tagSuggestions)

  inputs.forEach((input) => {
    console.debug("Initializing tags input:", input)
    new Tagify(input, {
      whitelist: tagSuggestions,
      originalInputValueFormat: (valuesArr: TagValue[]) =>
        valuesArr.map((item) => item.value).join(","),
    })
  })

  console.info("Tags inputs initialized.")
})()

interface TagValue {
  value: string
}

console.groupEnd()
