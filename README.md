# JWT Login demo

A small Spring Boot and React application showing username/password registration, login, and JWT protected API requests.

## Run it locally

Requirements: Java 21, Maven (or use the included wrapper), Node.js, and npm.

Start the backend from the repository root:

```powershell
.\mvnw.cmd spring-boot:run
```

In another terminal, start the React app:

```powershell
cd src/frontend
npm install
npm start
```

Open `http://localhost:3000`. The React development server forwards `/api` requests to `http://localhost:8080`.

## How the authentication flow works

1. **Register:** React sends `POST /api/auth/register` with `{ "username": "alex", "password": "a-long-password" }`. The API validates the input, hashes the password with BCrypt, saves the user in H2, and responds with a signed token and a safe user profile. Passwords are never returned.
2. **Login:** React sends the same shape to `POST /api/auth/login`. Spring Security loads the account, BCrypt compares the submitted password with the stored hash, and the API issues a JWT only when they match. Invalid credentials receive an authentication error.
3. **Keep the session:** React holds the token in `sessionStorage`, so it survives a page refresh in the current tab and is cleared when that tab's session ends. The token is configured to expire after 15 minutes by default.
4. **Call protected endpoints:** On startup, React requests `GET /api/me` with `Authorization: Bearer <token>`. The JWT filter verifies its signature and expiry, resolves the subject to a user, and sets the authenticated identity for that request. Spring Security rejects requests without a valid identity.
5. **Sign out:** The UI removes the token from `sessionStorage`. Since this demo uses stateless JWTs, signing out in the browser does not revoke a token already copied elsewhere; it remains valid until it expires.

## API

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Create an account and receive a token |
| `POST` | `/api/auth/login` | Public | Verify credentials and receive a token |
| `GET` | `/api/me` | Bearer JWT | Get the authenticated user's profile |

Registration and login JSON use `username` and `password`. Passwords must be 8–72 characters. Successful authentication returns `{ "token", "tokenType": "Bearer", "expiresIn", "user": { "id", "username" } }`.

## Configuration notes

- H2 is configured as an in-memory database. Users disappear when the backend stops.
- Set `JWT_SECRET` to a private random string of at least 32 bytes before deploying. The configured local default exists only to make the demo easy to run and must not be used in production.
- `JWT_EXPIRATION_SECONDS` sets token lifetime; the default is `900` seconds.
- The API permits browser requests from `http://localhost:3000` for local development. Update the CORS origin for a different frontend host.
- `sessionStorage` is convenient for this demo but JavaScript can read it. For a production browser application, consider a carefully configured `HttpOnly`, `Secure`, `SameSite` cookie design, refresh and revocation strategy, HTTPS, rate limiting, and persistent production database.
