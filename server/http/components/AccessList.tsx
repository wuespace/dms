import { cx } from "@hono/hono/css"
import { t } from "@wuespace/honolate"

/**
 * Component to display access roles with highlighting for owned roles as a definition list.
 * @param readOnlyRoles - Array of roles with read-only access.
 * @param readWriteRoles - Array of roles with read and write access.
 * @param ownRoles - Array of roles owned by the current user.
 * @returns A definition list displaying the access roles.
 */
export function AccessList({
  readOnlyRoles = [],
  readWriteRoles = [],
  ownRoles = [],
}: {
  readOnlyRoles: string[]
  readWriteRoles: string[]
  ownRoles: string[]
}) {
  const hasRole = (role: string) => ownRoles.includes(role)

  return (
    <dl>
      <dt>{t`Read Access`}</dt>
      <dd class="tags">
        {readOnlyRoles.map((r) => (
          <span
            key={r}
            class={cx("tag", hasRole(r) && "is-primary")}
          >
            {r}
          </span>
        ))}
      </dd>
      <dt>{t`Read and Write Access`}</dt>
      <dd class="tags">
        {readWriteRoles.map((w) => (
          <span
            key={w}
            class={cx("tag", hasRole(w) && "is-primary")}
          >
            {w}
          </span>
        ))}
      </dd>
    </dl>
  )
}
