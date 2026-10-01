# JWT login demo

The Spring Boot backend exposes `POST /api/login`. It checks the configured
single user and returns a signed HS256 JWT in an `accessToken` property, which
matches the frontend login form. No user database is configured.

For local development, the default login is `test` / `password`. Override it
with these environment variables as needed:

| Variable | Purpose |
| --- | --- |
| `AUTH_USERNAME` | Login username (defaults to `test`) |
| `AUTH_PASSWORD` | Login password (defaults to `password`) |
| `JWT_SECRET` | Optional signing secret, at least 32 UTF-8 bytes; generated randomly at startup when omitted |
| `JWT_EXPIRATION_SECONDS` | Token lifetime in seconds (defaults to `3600`) |
| `FRONTEND_ORIGIN` | Allowed browser origin (defaults to `http://localhost:3000`) |

For local development in PowerShell:

```powershell
$env:AUTH_USERNAME = "your-username"
$env:AUTH_PASSWORD = "your-password"
# Optional for local testing; the app generates one at startup if omitted.
# Set a stable secret when you need tokens to remain valid across restarts.
$env:JWT_SECRET = "replace-with-a-random-secret-of-at-least-32-bytes"
mvn spring-boot:run
```

With no environment variables set, the local defaults are `test` / `password`
and a randomly generated JWT secret. That generated secret changes on every
restart, so previously issued tokens will no longer verify.

In another terminal, run the React app with `cd src/frontend; npm start`.
The development proxy forwards `/api` requests to the backend on port 8080.

The login request body is `{"username":"...","password":"..."}`. Successful
responses have the form `{"accessToken":"<jwt>"}`; invalid credentials return
HTTP 401, missing credentials return HTTP 400, and incomplete server
configuration returns HTTP 503. The generated secret and default credentials
are for local development only. Set a strong password and stable, unique secret
outside source control, and use HTTPS in deployment.

Run the backend BDD scenarios with `mvn test`. The authentication behavior is
specified in `src/test/resources/features/authentication.feature` and executed
with Cucumber step definitions.
