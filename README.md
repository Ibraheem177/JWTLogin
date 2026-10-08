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

The backend stores users in PostgreSQL and BCrypt-hashes passwords before
storing them. New users can register from the sign-in form; login looks up the
username in this same database and verifies the submitted password against its
BCrypt hash. The Docker initialization script inserts a default test account
when it first creates the database; its credentials are **test / password**.
Configure `DATABASE_URL`, `DATABASE_USERNAME`, and `DATABASE_PASSWORD` to
change the PostgreSQL connection. Set a stable `JWT_SECRET` if backend-issued
tokens should remain valid across application restarts.

The Docker Compose PostgreSQL defaults are `appdb` / `appuser` / `apppass`.
PostgreSQL is published on host port `5434` to avoid conflicting with a local
PostgreSQL server; the backend defaults to this port.
The default test credentials are for local development only and are not safe
for deployment.

## Run locally

Keycloak uses port 8080, so the backend runs on port 8081 and the React
development server proxies API requests to it:

```powershell
docker compose -f src/docker/docker-compose.yml up -d
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

The backend login form posts to `POST /api/login`; registration posts to
`POST /api/register`. Set a strong `JWT_SECRET` (at least 32 UTF-8 bytes)
outside local development. The signing secret is generated at startup when
omitted. Run backend tests with `mvn test` and frontend tests with
`cd src/frontend; npm test`.
