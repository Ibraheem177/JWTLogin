package com.example.demo;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.sun.net.httpserver.HttpServer;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

/**
 * Test-only issuer with an HTTP public-key endpoint. The real Spring JWT decoder
 * downloads this key and checks real signatures; authentication is not mocked.
 * These tests exercise the API contract, not Keycloak's browser login screen.
 */
public abstract class JwtTestSupport {
    private static final RSAKey KEY;
    private static final HttpServer JWKS;
    public static final String ISSUER;

    static {
        try {
            KEY = new RSAKeyGenerator(2048).keyID("test-key").generate();
            JWKS = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
            byte[] publicKeys = new JWKSet(KEY.toPublicJWK()).toString().getBytes(StandardCharsets.UTF_8);
            JWKS.createContext("/certs", exchange -> {
                exchange.getResponseHeaders().set("Content-Type", "application/json");
                exchange.sendResponseHeaders(200, publicKeys.length);
                try (var body = exchange.getResponseBody()) {
                    body.write(publicKeys);
                }
            });
            JWKS.start();
            Runtime.getRuntime().addShutdownHook(new Thread(() -> JWKS.stop(0)));
            ISSUER = "http://127.0.0.1:" + JWKS.getAddress().getPort();
        } catch (Exception e) {
            throw new ExceptionInInitializerError(e);
        }
    }

    @DynamicPropertySource
    static void jwtProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.security.oauth2.resourceserver.jwt.issuer-uri", () -> ISSUER);
        registry.add("spring.security.oauth2.resourceserver.jwt.jwk-set-uri", () -> ISSUER + "/certs");
    }

    public static String token(String kind) throws JOSEException {
        long now = System.currentTimeMillis();
        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .subject(kind.equals("missing subject") ? null : "user-123")
                .claim("preferred_username", "alice")
                .issuer(kind.equals("wrong issuer") ? "https://untrusted.example" : ISSUER)
                .audience(List.of(kind.equals("wrong audience") ? "another-api" : "jwt-login-api"))
                .issueTime(new Date(now - 600_000))
                // Expire well outside Spring's clock-skew allowance.
                .expirationTime(new Date(now + (kind.equals("expired") ? -300_000 : 300_000)))
                .build();
        SignedJWT jwt = new SignedJWT(new JWSHeader.Builder(JWSAlgorithm.RS256)
                .keyID(KEY.getKeyID()).build(), claims);
        RSAKey signer = kind.equals("wrong signature") ? new RSAKeyGenerator(2048).generate() : KEY;
        jwt.sign(new RSASSASigner(signer));
        return kind.equals("malformed") ? "not-a-jwt" : jwt.serialize();
    }
}
