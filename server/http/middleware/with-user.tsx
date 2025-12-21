// deno-lint-ignore-file no-explicit-any
// We need any to resolve incompatibilities between node and deno hono types
import { createMiddleware } from "@hono/hono/factory"
import {
  getAuth,
  type IDToken,
  type OidcAuth,
  oidcAuthMiddleware,
  processOAuthCallback,
  revokeSession,
  type TokenEndpointResponses,
} from "@hono/oidc-auth"
import { LocalizedHttpException, lt, t } from "@wuespace/honolate"
import { z } from "@zod/zod"
import { redactContent } from "../../document-lifecycle/util/redact.ts"
import { getLogger, runWithLogContext } from "../../log.ts"
import { SYSTEM_USER, type User } from "../../model/user.ts"

/**
 * Middleware that ensures the request is authenticated and attaches the user to the context.
 * If the request is to the OIDC callback endpoint, it processes the OAuth callback.
 * If the request is to the logout endpoint, it revokes the session and renders a logout confirmation.
 * Otherwise, it uses the OIDC authentication middleware to authenticate the user
 * and attaches the user to the context.
 * @returns Middleware that attaches the authenticated user to the context.
 * @throws LocalizedHttpException if authentication fails or if the system user is used.
 */
export const withUser = createMiddleware<{
  Variables: {
    readonly user: User
    readonly oidcClaimsHook: typeof oidcClaimsHook
  }
}>(async (c, next) => {
  if (c.get("user")) {
    // apperently, we've already run this middleware
    return next()
  }

  if (c.req.path === "/oidc/callback") {
    c.set("oidcClaimsHook", oidcClaimsHook)
    // "as any" is needed because of incompatible types between node and deno
    return processOAuthCallback(c as any)
  }

  if (c.req.path === "/logout") {
    getLogger().debug("Processing logout request")
    await revokeSession(c as any)
    return c.render(
      <div class="section">
        <title>{t`Logged out - WüSpace DMS`}</title>
        <h1 class="title is-2">{t`Logged out`}</h1>
        <p class="subtitle is-4">
          {t`You have been logged out successfully.`}
        </p>
        <a href="/" class="button">{t`Login and return to Dashboard`}</a>
      </div>,
    )
  }

  return await oidcAuthMiddleware()(c as any, async () => {
    c.set("oidcClaimsHook", oidcClaimsHook) // re-set in case the token gets refreshed
    // "as any" is needed because of incompatible types between node and deno
    // "as User" is safe since we know "oidcClaimsHook" will return a User
    const authorizedUser = await getAuth(c as any) as unknown as User
    c.set("user", authorizedUser)

    if (authorizedUser.id === SYSTEM_USER.id) {
      // No web request can authenticate as the system user
      throw new LocalizedHttpException({
        status: 403,
        technicalMessage: "System user not allowed",
      })
    }

    return runWithLogContext({
      userId: authorizedUser.id,
      userRoles: authorizedUser.roles,
      user: redactContent(authorizedUser, "name"),
    }, next)
  })
})

async function oidcClaimsHook(
  orig: OidcAuth | undefined,
  claims: IDToken | undefined,
  _response: TokenEndpointResponses,
): Promise<User> {
  const oidcConfig = await z.object({
    OIDC_AUTH_SECRET: z.string().min(32),
    OIDC_CLIENT_ID: z.string(),
    OIDC_CLIENT_SECRET: z.string(),
    OIDC_ISSUER: z.url(),
    OIDC_REDIRECT_URI: z.url().endsWith("/oidc/callback"),
    OIDC_SCOPES: z.string().includes("openid"),
    OIDC_ROLES_CLAIM: z.string().min(1).catch("roles"),
    OIDC_UID_CLAIM: z.string().min(1).catch("sub"),
    OIDC_NAME_CLAIM: z.string().min(1).catch("name"),
  }).parseAsync(Deno.env.toObject()).catch((e) => {
    getLogger("[with-user]").withError(e).fatal(
      "Failed to parse OIDC configuration from environment.",
    )
    Deno.exit(1)
  })

  const { data: userClaims, error } = z.object({
    id: z.string().min(1),
    name: z.string().default("Anonymous User"),
    roles: z.union([z.string(), z.array(z.string())]).transform((roles) =>
      // if roles is a string, split it by space
      Array.isArray(roles) ? roles : roles.split(" ")
    ),
  }).safeParse({
    id: claims?.[oidcConfig.OIDC_UID_CLAIM] ??
      orig?.[oidcConfig.OIDC_UID_CLAIM],
    name: claims?.[oidcConfig.OIDC_NAME_CLAIM] ??
      orig?.[oidcConfig.OIDC_NAME_CLAIM],
    roles: claims?.[oidcConfig.OIDC_ROLES_CLAIM] ??
      orig?.[oidcConfig.OIDC_ROLES_CLAIM] ?? [],
  })

  if (error) {
    throw new LocalizedHttpException({
      status: 500,
      technicalMessage: "Failed to parse user claims",
      localizedTitle: lt`Invalid SSO Data`,
      localizedMessage:
        lt`The server encountered an issue while parsing user claims from the SSO. Please contact support for assistance.`,
      cause: error,
    })
  }

  if (userClaims.id === SYSTEM_USER.id) {
    // No web request can authenticate as the system user
    throw new LocalizedHttpException({
      status: 403,
      technicalMessage: "System user not allowed",
    })
  }

  return Promise.resolve(userClaims)
}
