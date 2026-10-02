package com.example.demo.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

import javax.crypto.Mac;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;

@Service
public class AuthService {
    private static final String JWT_HEADER = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";
    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecretKey signingKey;
    private final long expirationSeconds;
    private final ObjectMapper objectMapper;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            SecretKey signingKey,
            @Value("${app.jwt.expiration-seconds:3600}") long expirationSeconds,
            ObjectMapper objectMapper) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.signingKey = signingKey;
        this.expirationSeconds = expirationSeconds;
        this.objectMapper = objectMapper;
    }

    public boolean isConfigured() {
        return signingKey.getEncoded().length >= 32
                && expirationSeconds > 0;
    }

    public long getExpirationSeconds() {
        return expirationSeconds;
    }

    public boolean hasValidCredentials(String username, String password) {
        return userRepository.findByUsername(username)
                .map(user -> passwordEncoder.matches(password, user.getPasswordHash()))
                .orElse(false);
    }

    public String createToken(String username) {
        try {
            Instant issuedAt = Instant.now();
            String header = encode(JWT_HEADER.getBytes(StandardCharsets.UTF_8));
            String payload = encode(objectMapper.writeValueAsBytes(Map.of(
                    "iss", "jwt-login-local",
                    "sub", username,
                    "preferred_username", username,
                    "iat", issuedAt.getEpochSecond(),
                    "exp", issuedAt.plusSeconds(expirationSeconds).getEpochSecond())));
            String signingInput = header + "." + payload;
            return signingInput + "." + encode(sign(signingInput));
        } catch (JacksonException exception) {
            throw new IllegalStateException("Could not create the authentication token.", exception);
        }
    }

    private byte[] sign(String signingInput) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(signingKey);
            return mac.doFinal(signingInput.getBytes(StandardCharsets.US_ASCII));
        } catch (java.security.GeneralSecurityException exception) {
            throw new IllegalStateException("Could not sign the authentication token.", exception);
        }
    }

    private static String encode(byte[] value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value);
    }
}
