package com.example.demo.auth;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class AuthController {

    private final AuthService authService;
    private final RestClient restClient;
    private final String keycloakIssuer;
    private final String keycloakClientId;
    private final String keycloakClientSecret;
    private final String keycloakRedirectUri;

    public AuthController(AuthService authService,
                          RestClient.Builder restClientBuilder,
                          @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri}") String keycloakIssuer,
                          @Value("${app.keycloak.client-id}") String keycloakClientId,
                          @Value("${app.keycloak.client-secret}") String keycloakClientSecret,
                          @Value("${app.keycloak.redirect-uri}") String keycloakRedirectUri) {
        this.authService = authService;
        this.restClient = restClientBuilder.build();
        this.keycloakIssuer = keycloakIssuer.replaceAll("/$", "");
        this.keycloakClientId = keycloakClientId;
        this.keycloakClientSecret = keycloakClientSecret;
        this.keycloakRedirectUri = keycloakRedirectUri;
    }

    @GetMapping("/keycloak")
    public ResponseEntity<?> keycloakCallback(@RequestParam String code) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "authorization_code");
        form.add("code", code);
        form.add("client_id", keycloakClientId);
        form.add("client_secret", keycloakClientSecret);
        form.add("redirect_uri", keycloakRedirectUri);

        try {
            KeycloakTokenResponse token = restClient.post()
                    .uri(keycloakIssuer + "/protocol/openid-connect/token")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(KeycloakTokenResponse.class);
            if (token == null || token.accessToken() == null) {
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                        .body(new ErrorResponse("Keycloak did not return an access token."));
            }
            return ResponseEntity.ok(new LoginResponse(token.accessToken(), token.expiresIn()));
        } catch (org.springframework.web.client.RestClientException exception) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("The Keycloak authorization code could not be exchanged."));
        }
    }

    @GetMapping("/me")
    public CurrentUser currentUser(@AuthenticationPrincipal Jwt jwt) {
        return new CurrentUser(
                jwt.getSubject(),
                jwt.getClaimAsString("preferred_username"),
                jwt.getClaimAsString("email"),
                jwt.getClaimAsString("name"));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (request == null || request.username() == null || request.username().isBlank()
                || request.password() == null || request.password().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Username and password are required."));
        }

        String username = request.username().trim();
        if (username.length() > 100) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Username must be 100 characters or fewer."));
        }

        if (!authService.register(username, request.password())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ErrorResponse("That username is already registered."));
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new RegisterResponse(username));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (request == null || request.username() == null || request.username().isBlank()
                || request.password() == null || request.password().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Username and password are required."));
        }

        if (!authService.isConfigured()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new ErrorResponse("Authentication is not configured on the server."));
        }

        if (!authService.hasValidCredentials(request.username(), request.password())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("Invalid username or password."));
        }

        return ResponseEntity.ok(new LoginResponse(
                authService.createToken(request.username()),
                authService.getExpirationSeconds()));
    }

    public record LoginRequest(String username, String password) {
    }

    public record RegisterRequest(String username, String password) {
    }

    public record RegisterResponse(String username) {
    }

    public record LoginResponse(String accessToken, long expiresIn) {
    }

    private record KeycloakTokenResponse(
            @com.fasterxml.jackson.annotation.JsonProperty("access_token") String accessToken,
            @com.fasterxml.jackson.annotation.JsonProperty("expires_in") long expiresIn) {
    }

    public record CurrentUser(String subject, String username, String email, String name) {
    }

    public record ErrorResponse(String message) {
    }
}
