package com.example.demo;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import javax.crypto.SecretKey;

@Configuration
public class LocalJwtDecoderConfiguration {
    private static final String LOCAL_ISSUER = "jwt-login-local";

    @Bean
    SecretKey jwtSigningKey(@Value("${app.jwt.secret}") String jwtSecret) {
        return new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }

    @Bean
    JwtDecoder jwtDecoder(
            @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri}") String keycloakIssuer,
            SecretKey jwtSigningKey,
            ObjectMapper objectMapper) {
        NimbusJwtDecoder keycloakDecoder = NimbusJwtDecoder
                .withJwkSetUri(keycloakIssuer.replaceAll("/$", "") + "/protocol/openid-connect/certs")
                .build();
        keycloakDecoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(keycloakIssuer));

        NimbusJwtDecoder localDecoder = NimbusJwtDecoder
                .withSecretKey(jwtSigningKey)
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
        localDecoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(LOCAL_ISSUER));

        return token -> {
            String issuer = readIssuer(token, objectMapper);
            return LOCAL_ISSUER.equals(issuer)
                    ? localDecoder.decode(token)
                    : keycloakDecoder.decode(token);
        };
    }

    private String readIssuer(String token, ObjectMapper objectMapper) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                throw new BadJwtException("Invalid bearer token.");
            }
            return objectMapper.readTree(Base64.getUrlDecoder().decode(parts[1]))
                    .path("iss")
                    .asText();
        } catch (IllegalArgumentException | JacksonException exception) {
            throw new BadJwtException("Invalid bearer token.");
        }
    }
}
