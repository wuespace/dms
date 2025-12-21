import { getASNPrefixPattern } from "./getASNPrefixPattern.ts"
import { Config } from "../getConfig.ts"
import { User } from "../model/user.ts"

/**
 * Gets the authorized patterns for a user based on their roles and the application configuration.
 *
 * A user is authorized if they have one of the roles listed in the `read` or `write` arrays for a given folder prefix.
 * If `requireWritePermissions` is `true`, only patterns for which the user has write permissions are returned.
 * @param user the user object
 * @param config the application configuration
 * @param requireWritePermissions whether the patterns should be calculated for write permissions. Will calculate for read-only permissions if `false`.
 * @returns regular expressions for WBD numbers which the user is authorized to operate on.
 */
export function getAuthorizedPatterns(
  user: Pick<User, "roles">,
  config: Config,
  requireWritePermissions: boolean,
): RegExp[] {
  const asnPatterns = [] as RegExp[]
  for (const { prefix, registers, read, write } of config.folders) {
    const pattern = getASNPrefixPattern(prefix, Object.keys(registers))

    if (write.some((role: string) => user.roles.includes(role))) {
      // User has write (and, implicitly, read) permissions for this pattern
      asnPatterns.push(pattern)
      continue
    }
    if (requireWritePermissions) {
      // Ignore read-only patterns since write permissions are required
      continue
    }
    if (read.some((role) => user.roles.includes(role))) {
      // User has read permissions for this pattern
      asnPatterns.push(pattern)
    }
  }
  return asnPatterns
}
