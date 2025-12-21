import { cx } from "@hono/hono/css"
import { t } from "@wuespace/honolate"

/**
 * Component to display a notification about the user's access level to a folder.
 *
 * Props:
 * - hasReadAccess: boolean indicating if the user has read access.
 * - hasReadWriteAccess: boolean indicating if the user has read and write access.
 * @returns A notification element displaying the user's access level.
 */
export function AccessNotification(
  { hasReadAccess, hasReadWriteAccess }: {
    hasReadAccess?: boolean
    hasReadWriteAccess?: boolean
  },
) {
  return (
    <div
      className={cx(
        "notification",
        hasReadWriteAccess && "is-success",
        hasReadAccess && !hasReadWriteAccess && "is-info",
        !hasReadAccess && !hasReadWriteAccess && "is-warning",
      )}
    >
      <p>
        {hasReadWriteAccess
          ? t`You have read and write access to this folder. This means you can see all documents and also upload new ones.`
          : hasReadAccess
          ? t`You have read access to this folder. This means you can see all documents in this folder.`
          : t`You do not have access to this folder. You can only view documents explicitly marked as public.`}
      </p>
    </div>
  )
}
