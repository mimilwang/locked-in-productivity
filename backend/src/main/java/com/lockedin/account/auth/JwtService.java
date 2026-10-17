package com.lockedin.account.auth;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/** Creates and checks login tokens (JWTs). The user's id is stored in the token's "sub" (subject). */
@Service
public class JwtService {

    private final SecretKey key;
    private final Duration lifetime;
    private final Clock clock;

    public JwtService(@Value("${jwt.secret}") String secret,
                      @Value("${jwt.expiration-hours:24}") long expirationHours,
                      Clock clock) {
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("jwt.secret must be at least 32 characters long");
        }
        this.key = Keys.hmacShaKeyFor(bytes);
        this.lifetime = Duration.ofHours(expirationHours);
        this.clock = clock;
    }

    public String createToken(Long userId) {
        Instant now = clock.instant();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(lifetime)))
                .signWith(key)
                .compact();
    }

    /** Returns the user id, or empty if the token is invalid, tampered with, or expired. */
    public Optional<Long> parseUserId(String token) {
        try {
            String subject = Jwts.parser()
                    .verifyWith(key)
                    .clock(() -> Date.from(clock.instant()))
                    .build()
                    .parseSignedClaims(token)
                    .getPayload()
                    .getSubject();
            return Optional.of(Long.parseLong(subject));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        } catch (RuntimeException e) {
            // Anything else that goes wrong while reading a token also means "not a valid token".
            return Optional.empty();
        }
    }
}
