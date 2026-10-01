# Authentication flow

This branch has migrated from homemade JWT login to **Keycloak with OAuth2/OpenID Connect**.

Read [KEYCLOAK_GUIDE.md](KEYCLOAK_GUIDE.md) for the current implementation, startup commands, reference-repository mapping, code explanations and tests.

Open [KEYCLOAK_FLOW.excalidraw](KEYCLOAK_FLOW.excalidraw) in Excalidraw for the editable sequence diagram.

The old AuthService, JwtService and JwtAuthenticationFilter implementation remains available in Git history before the Keycloak migration.
