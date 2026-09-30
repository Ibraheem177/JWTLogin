# JWT Login – How It Works

## The big idea

A **JWT (JSON Web Token)** is a signed "ID card" the server gives you after you log in.
You show it on every request. The server doesn't remember you — it just checks the
signature on the card. This is called **stateless** authentication.

```
eyJhbGciOiJIUzI1NiJ9 . eyJzdWIiOiJhbGljZSIsImlhdCI6...,"exp":...} . i4IzKb-kXcEjODo6G0h8...
      HEADER                         PAYLOAD (claims)                    SIGNATURE
 {"alg":"HS256"}           {"sub":"alice","iat":..., "exp":...}   HMAC-SHA256(header.payload, secret)
```

- Header and payload are only Base64-encoded, **not encrypted** — anyone can read them. Never put passwords in them.
- The signature can only be made with the server's secret key. Change one character of the payload and the signature no longer matches → rejected.

## Components (boxes for the diagram)

| Layer | File | Job |
|---|---|---|
| React | `src/frontend/src/components/LoginForm.js` | Login / register form |
| React | `src/frontend/src/components/Profile.js` | Protected page, logout |
| React | `src/frontend/src/api.js` | `fetch` calls; saves token in `localStorage`; adds `Authorization: Bearer <token>` |
| Spring | `config/SecurityConfig.java` | Rules: `/api/auth/**` public, everything else needs a token; stateless; CORS; BCrypt |
| Spring | `security/JwtAuthenticationFilter.java` | Runs before every request; reads & validates the Bearer token |
| Spring | `security/JwtService.java` | Creates and verifies tokens (JJWT library) |
| Spring | `auth/AuthController.java` | `POST /api/auth/register`, `POST /api/auth/login` |
| Spring | `auth/AuthService.java` | Hash password on register; check password + issue token on login |
| Spring | `user/UserController.java` | `GET /api/users/me` (protected) |
| Spring | `user/User.java`, `UserRepository.java` | `users` table (username + BCrypt hash) in H2 |
| Tests | `src/test/resources/features/login.feature` | BDD scenarios in plain English (Gherkin) |
| Tests | `src/test/java/.../bdd/LoginSteps.java` | Java code behind each Gherkin line |

## Flow 1 – Register

```
LoginForm ──POST /api/auth/register {username, password}──▶ JwtAuthenticationFilter (no token, passes through)
                                                           ▶ SecurityConfig: /api/auth/** is permitAll
                                                           ▶ AuthController.register
                                                           ▶ AuthService.register
                                                               ├─ username taken? → 409 Conflict
                                                               ├─ BCrypt.encode(password) → "$2a$10$..."
                                                               └─ UserRepository.save(User)
          ◀──────────────── 201 Created ──────────────────
```

## Flow 2 – Login (token is created)

```
LoginForm ──POST /api/auth/login {username, password}──▶ AuthController.login
                                                        ▶ AuthService.login
                                                            ├─ UserRepository.findByUsername
                                                            ├─ BCrypt.matches(password, hash)?  no → 401
                                                            └─ JwtService.generateToken(username)
                                                                 sub=alice, iat=now, exp=now+1h, sign with secret
          ◀──── 200 {"token":"xxx.yyy.zzz","username":"alice"} ────
api.js: localStorage.setItem("jwt", token)
```

## Flow 3 – Calling a protected endpoint (token is checked)

```
Profile ──GET /api/users/me   Authorization: Bearer xxx.yyy.zzz──▶ JwtAuthenticationFilter
                                                                    ├─ header starts with "Bearer "?
                                                                    ├─ JwtService.isValid(token)
                                                                    │    signature OK? not expired?
                                                                    └─ yes → SecurityContext = "alice"
                                                                  ▶ SecurityConfig: authenticated? 
                                                                    no  → 401 (HttpStatusEntryPoint)
                                                                    yes → UserController.me
        ◀──────────── 200 {"username":"alice"} ─────────────
```

If the token is missing, expired or tampered with, the filter sets nothing, the request
is anonymous, and Spring Security returns **401**. The React app then clears the token
and shows the login form.

## Flow 4 – Logout

Just `localStorage.removeItem("jwt")`. The server has no session to destroy.
(Trade-off: a stolen token stays valid until it expires — that's why expiry is short.)

## BDD with Cucumber

- `login.feature` describes behaviour in **Given / When / Then** that non-developers can read.
- `CucumberTest` tells JUnit to run all `.feature` files with the Cucumber engine.
- `CucumberSpringConfiguration` boots the **real** app on a random port (`@SpringBootTest(RANDOM_PORT)`).
- `LoginSteps` maps each sentence (e.g. `I log in with username {string} and password {string}`)
  to Java that sends real HTTP requests and asserts the result.
- The DB is cleared before each scenario (`@Before`) so scenarios don't affect each other.

Run: `./mvnw test` → 7 scenarios covering register, duplicate user, good/bad login,
access with / without / with a tampered token.

## Running it

```bash
./mvnw spring-boot:run          # backend on http://localhost:8080
cd src/frontend && npm start    # frontend on http://localhost:3000
```

## Questions a reviewer might ask

- **Why not store the password?** Only a BCrypt hash is stored; BCrypt is salted and deliberately slow.
- **Why is CSRF disabled?** CSRF abuses cookies the browser sends automatically. Our token is sent
  in a header by our own JS, so a malicious site can't attach it.
- **Why CORS config?** React (port 3000) and Spring (8080) are different origins; the browser blocks
  cross-origin calls unless the server allows that origin.
- **Where does the secret come from?** `app.jwt.secret`, overridable by the `JWT_SECRET` env var.
  The default in the repo is for local dev only.
- **localStorage vs cookie?** localStorage is simple but readable by any JS on the page (XSS risk).
  An httpOnly cookie is safer in production but brings back CSRF concerns.
- **What's missing for production?** Refresh tokens, roles/authorities, rate-limiting login,
  a real database, secret from a vault.
