package com.example.demo.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;

@Service
public class AuthService {
    private static final String JWT_HEADER = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";
    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private final String configuredUsername;
    private final String configuredPassword;
    private final byte[] signingKey;
    private final long expirationSeconds;
    private final ObjectMapper objectMapper;

    public AuthService(
            @Value("${app.auth.username:}") String configuredUsername,
            @Value("${app.auth.password:}") String configuredPassword,
            @Value("${app.jwt.secret:}") String jwtSecret,
            @Value("${app.jwt.expiration-seconds:3600}") long expirationSeconds,
            ObjectMapper objectMapper) {
        this.configuredUsername = configuredUsername;
        this.configuredPassword = configuredPassword;
        this.signingKey = jwtSecret.getBytes(StandardCharsets.UTF_8);
        this.expirationSeconds = expirationSeconds;
        this.objectMapper = objectMapper;
    }

    public boolean isConfigured() {
        return !configuredUsername.isBlank()
                && !configuredPassword.isBlank()
                && signingKey.length >= 32
                && expirationSeconds > 0;
    }

    public boolean hasValidCredentials(String username, String password) {
        return MessageDigest.isEqual(
                    configuredUsername.getBytes(StandardCharsets.UTF_8),
                    username.getBytes(StandardCharsets.UTF_8))
                && MessageDigest.isEqual(
                    configuredPassword.getBytes(StandardCharsets.UTF_8),
                    password.getBytes(StandardCharsets.UTF_8));
    }

    public String createToken(String username) {
        try {
            Instant issuedAt = Instant.now();
            String header = encode(JWT_HEADER.getBytes(StandardCharsets.UTF_8));
            String payload = encode(objectMapper.writeValueAsBytes(Map.of(
                    "sub", username,
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
            mac.init(new SecretKeySpec(signingKey, HMAC_ALGORITHM));
            return mac.doFinal(signingInput.getBytes(StandardCharsets.US_ASCII));
        } catch (java.security.GeneralSecurityException exception) {
            throw new IllegalStateException("Could not sign the authentication token.", exception);
        }
    }

    private static String encode(byte[] value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value);
    }
}
