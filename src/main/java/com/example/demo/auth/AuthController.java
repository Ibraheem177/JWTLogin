package com.example.demo.auth;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class AuthController {

    private final AuthService authService;
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/me")
    public CurrentUser currentUser(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (principal instanceof Jwt jwt) {
            return new CurrentUser(jwt.getSubject(), jwt.getClaimAsString("preferred_username"),
                    jwt.getClaimAsString("email"), jwt.getClaimAsString("name"));
        }
        if (principal instanceof OidcUser oidcUser) {
            return new CurrentUser(oidcUser.getSubject(), oidcUser.getPreferredUsername(),
                    oidcUser.getEmail(), oidcUser.getFullName());
        }
        return new CurrentUser(authentication.getName(), authentication.getName(), null, null);
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

    public record CurrentUser(String subject, String username, String email, String name) {
    }

    public record ErrorResponse(String message) {
    }
}
