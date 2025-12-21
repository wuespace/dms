export function redactContent<X extends Readonly<object>>(
  raw: X | null | undefined,
  ...keys: Array<keyof X>
) {
  if (!raw) {
    return raw
  }

  if (!keys.length && Object.hasOwn(raw, "content")) {
    keys.push("content" as keyof typeof raw)
  }

  const redacted: { [key in keyof X]: X[key] | string } = {
    ...raw,
  }

  for (const key of keys) {
    if (typeof raw[key] !== "string") {
      redacted[key] = "[REDACTED]"
      continue
    }
    redacted[key] = `[REDACTED; ${raw[key].length} bytes]`
  }
  return redacted
}
