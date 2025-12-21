export function getASNPrefixPattern(
  prefix: string,
  registers: string[] = [],
): RegExp {
  return new RegExp(`^${prefix}[${registers.join("")}]\\d+$`)
}
