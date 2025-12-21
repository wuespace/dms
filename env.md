# Configuration Environment Variables

Note that for every parameter, you can also set "[PARAMETER]_FILE" to a file
that contains the value. This is especially useful for things like mounted
secrets in Docker Swarm or Kubernetes.

## Configuration File

### `CONFIG` (optional)

Set the config file contents. Must be a valid YAML string. In most cases, you'll
want to use CONFIG_FILE, instead.

#### Default Value (used by the application if not provided)

```env
CONFIG=
```

#### Other Examples

```env
CONFIG="{ ... }"
```

### `CONFIG_FILE`

The path to the configuration file. Must be set unless you set the config
directly.

#### Default Value (from the example environment file, must be provided)

```env
CONFIG_FILE="config/config.yml"
```

#### Other Examples

```env
CONFIG_FILE=/etc/dms/config.yml
```

## Folder Ingest Configuration

### `FOLDER_INGEST_CRON` (optional)

The CRON expression that determines how often the folder should be checked for
new files.

#### Default Value (used by the application if not provided)

```env
FOLDER_INGEST_CRON=
```

#### Other Examples

```env
FOLDER_INGEST_CRON="* * * * *" # Every minute
```

```env
FOLDER_INGEST_CRON="*/5 * * * *" # Every 5 minutes
```

```env
FOLDER_INGEST_CRON="30 3 * * *" # Every day at 3:30 AM
```

### `FOLDER_INGEST_PATH` (optional)

The path to the folder that should be watched for new files. This can be a
relative path, in which case it is relative to the working directory.

#### Default Value (used by the application if not provided)

```env
FOLDER_INGEST_PATH=
```

#### Other Examples

```env
FOLDER_INGEST_PATH=/var/dms/ingest
```

## MongoDB URI

### `MONGO_URI`

The connection string for your MongoDB instance. This is optional when used with
the provided compose.yml, but mandatory otherwise.

#### Default Value (from the example environment file, must be provided)

```env
MONGO_URI=mongodb://mongo:27017/mongodb-dms
```

## OIDC (OpenID Connect) Configuration

### `OIDC_AUTH_SECRET`

Secret key used for signing and verifying tokens. Must be at least 32 characters
long for security purposes.

#### Default Value (from the example environment file, must be provided)

```env
OIDC_AUTH_SECRET=RANDOM_SECRET_WITH_MIN_32_CHARS_CHANGE_ME_IMMEDIATELY_UPON_COPYING
```

### `OIDC_CLIENT_ID`

Client ID provided by your OIDC provider. Replace "XXX" with your actual client
ID.

#### Default Value (from the example environment file, must be provided)

```env
OIDC_CLIENT_ID="XXX"
```

### `OIDC_CLIENT_SECRET`

Client Secret provided by your OIDC provider. Replace "XXX" with your actual
client secret.

#### Default Value (from the example environment file, must be provided)

```env
OIDC_CLIENT_SECRET="XXX"
```

### `OIDC_ISSUER`

The URL of the OIDC provider's authorization server. This is where your
application will redirect users to authenticate.

#### Default Value (from the example environment file, must be provided)

```env
OIDC_ISSUER=https://logto.example.com/oidc # Logto
```

#### Other Examples

```env
OIDC_ISSUER=https://authentik.example.com/application/o/dms/ # Authentik
```

```env
OIDC_ISSUER=https://authelia.example.com # Authelia
```

```env
OIDC_ISSUER=https://keycloak.example.com/realms/[REALM] # Keycloak
```

### `OIDC_NAME_CLAIM` (optional)

The claim in the ID token that contains the user's name.

#### Default Value (used by the application if not provided)

```env
OIDC_NAME_CLAIM=name
```

#### Other Examples

```env
OIDC_NAME_CLAIM=preferred_username
```

### `OIDC_REDIRECT_URI`

The URL to which the OIDC provider will redirect users after authentication.
This should match the redirect URI registered with your OIDC provider.

#### Default Value (from the example environment file, must be provided)

```env
OIDC_REDIRECT_URI=http://localhost:41319/oidc/callback
```

### `OIDC_ROLES_CLAIM` (optional)

The claim in the ID token that contains the user's roles.

#### Default Value (used by the application if not provided)

```env
OIDC_ROLES_CLAIM=roles
```

#### Other Examples

```env
OIDC_ROLES_CLAIM=groups
```

```env
OIDC_ROLES_CLAIM=custom-roles-claim
```

### `OIDC_SCOPES`

Scopes requested from the OIDC provider. These determine the information
returned in the ID token.

#### Default Value (from the example environment file, must be provided)

```env
OIDC_SCOPES="openid profile roles"
```

### `OIDC_UID_CLAIM` (optional)

The claim in the ID token that contains the user's unique identifier.

#### Default Value (used by the application if not provided)

```env
OIDC_UID_CLAIM=sub
```

#### Other Examples

```env
OIDC_UID_CLAIM=uid
```

```env
OIDC_UID_CLAIM=email
```

```env
OIDC_UID_CLAIM=custom-uid-claim
```

## Other

### `SENTRY_DSN` (optional)

The DSN provided by Sentry or a compatible service like GlitchTip. Defaults to
an empty string, disabling error tracking.

#### Default Value (used by the application if not provided)

```env
SENTRY_DSN=
```

#### Other Examples

```env
SENTRY_DSN="https://xxx.glitchtip.example.com/xxx"
```

```env
SENTRY_DSN="https://xxx@xxx.ingest.us.sentry.io/xxx"
```
