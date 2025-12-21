import { getAuthorizedPatterns } from "./getAuthorizedPatterns.ts"
import { Config } from "../getConfig.ts"
import { SYSTEM_USER, User } from "../model/user.ts"

/**
 * Returns a MongoDB query object that filters for documents the user has permission to read or write.
 *
 * This can be used to restrict database queries based on user permissions.
 * @param user the user for which the permission query gets generated
 * @param config the current application configuration
 * @param requireWritePermissions whether the query should check for write permissions
 * @returns a MongoDB query object that filters for objects the user has permission to operate on.
 */
export function getPermissionQuery(
  user: User,
  config: Config,
  requireWritePermissions = false,
) {
  if (user === SYSTEM_USER) {
    // System user can read/write everything
    return {}
  }

  const asnPatterns = getAuthorizedPatterns(
    user,
    config,
    requireWritePermissions,
  )

  return {
    $or: [
      {
        // Document is explicitly allowed to be written by the user
        "permissions.write.groups": {
          $in: user.roles,
        },
      },
      ...(requireWritePermissions ? [] : [
        {
          // Document is public to read
          "tags": {
            $in: config.publicTags,
          },
        },
        {
          // Document is explicitly allowed to be read by the user
          "permissions.read.groups": {
            $in: user.roles,
          },
        },
      ]),
      {
        // ASN is in the list of patterns that the user is allowed to read/write
        asn: {
          $in: asnPatterns,
        },
      },
    ],
  }
}
