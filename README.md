# JWT login demo

The React frontend supports both backend-user and Keycloak authentication:

- **Sign in with Keycloak** uses OAuth 2.0 Authorization Code flow with PKCE
  (`S256`) and redirects to Keycloak's hosted login.
- The username/password form sends credentials to the Spring backend, which
  checks a BCrypt password hash in its user repository and returns a
  backend-signed JWT.

The Spring Boot backend validates both Keycloak access tokens and its own
signed login tokens before allowing access to `/api/**`. `GET /api/me` returns
the authenticated user's basic profile.

## Keycloak setup

Configure `ReactClient` as a public OpenID Connect client with standard flow
enabled and these values:

| Setting | Value |
| --- | --- |
| Valid redirect URIs | `http://localhost:3000/*` |
| Web origins | `http://localhost:3000` |

The frontend expects Keycloak to be reachable by the browser at
`http://localhost:8080`. Override this with `REACT_APP_KEYCLOAK_URL` if needed.
The backend expects the realm issuer at
`http://localhost:8080/realms/ITCJWTRealm`; override it with
`KEYCLOAK_ISSUER_URI` if Keycloak publishes a different issuer URL. The issuer
must exactly match the `iss` claim in Keycloak access tokens.

The frontend handles passwords entered in its backend-login form, so an XSS
vulnerability or compromised frontend dependency could capture them. The
hosted Keycloak login keeps passwords on the Keycloak origin and is preferable
for production. Use HTTPS outside local development.

## Backend user repository

The backend stores users in a file-backed H2 database and BCrypt-hashes
passwords before storing them. At startup it seeds a bootstrap user from
`AUTH_USERNAME` and `AUTH_PASSWORD` if that username is not already in the
repository. The default database files are stored under `data/` and ignored by
Git. Configure `DATABASE_URL`, `DATABASE_USERNAME`, and `DATABASE_PASSWORD`
to change the H2 database location or credentials. Set a stable `JWT_SECRET`
if backend-issued tokens should remain valid across application restarts.

For local development, the seeded default account is **admin / password**.
These public default credentials are not safe for deployment: set unique
`AUTH_USERNAME` and `AUTH_PASSWORD` values before starting the backend.

## Run locally

Keycloak uses port 8080, so the backend runs on port 8081 and the React
development server proxies API requests to it:

```powershell
mvn spring-boot:run
```

In another terminal:

```powershell
cd src/frontend
npm start
```

Open `http://localhost:3000` and choose **Sign in with Keycloak** for hosted
OAuth sign-in, or enter the backend user credentials in the form. After
sign-in, the frontend calls `GET /api/me` with the corresponding bearer token.
Tokens are held in memory; Keycloak tokens are refreshed before expiry, while
backend-issued tokens expire and require signing in again. Use the exported
`authenticatedFetch` helper in `src/frontend/src/api.js` for other
authenticated API requests. The backend port can be changed with
`SERVER_PORT`, and the allowed frontend origin with `FRONTEND_ORIGIN`.

The backend login form posts to `POST /api/login`. Configure the bootstrap
credentials with `AUTH_USERNAME` and `AUTH_PASSWORD`, and set a strong
`JWT_SECRET` (at least 32 UTF-8 bytes) outside local development. The signing
secret is generated at startup when omitted. Run backend tests with `mvn test`
and frontend tests with `cd src/frontend; npm test`.
