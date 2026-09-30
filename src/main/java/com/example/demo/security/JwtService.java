package com.example.demo.security;

import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

/**
 * Creates and checks JSON Web Tokens.
 *
 * A JWT is three Base64 parts joined by dots:  HEADER.PAYLOAD.SIGNATURE
 *   header    - {"alg":"HS256"}                     which algorithm signed it
 *   payload   - {"sub":"alice","iat":...,"exp":...}  the "claims" (who + when)
 *   signature - HMAC-SHA256(header + payload, secretKey)
 *
 * Only the server knows the secret key, so only the server can produce a valid
 * signature. If anyone edits the payload, the signature no longer matches.
 */
@Service
public class JwtService {

    private final SecretKey signingKey;
    private final long expirationMs;

    public JwtService(@Value("${app.jwt.secret}") String base64Secret,
                      @Value("${app.jwt.expiration-ms}") long expirationMs) {
        this.signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(base64Secret));
        this.expirationMs = expirationMs;
    }

    /** Called after a successful login: builds a signed token for this user. */
    public String generateToken(String username) {
        Date now = new Date();
        return Jwts.builder()
                .subject(username)                                    // "sub" claim
                .issuedAt(now)                                        // "iat" claim
                .expiration(new Date(now.getTime() + expirationMs))   // "exp" claim
                .signWith(signingKey)                                 // adds the signature
                .compact();                                           // -> "xxx.yyy.zzz"
    }

    /**
     * Verifies the signature and expiry, then returns the username inside.
     * Throws JwtException if the token was tampered with, expired or malformed.
     */
    public String extractUsername(String token) {
        return parseClaims(token).getSubject();
    }

    public boolean isValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)   // reject if signature doesn't match
                .build()
                .parseSignedClaims(token) // also rejects if "exp" is in the past
                .getPayload();
    }
}
