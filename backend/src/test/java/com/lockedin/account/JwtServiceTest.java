package com.lockedin.account;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.lockedin.account.auth.JwtService;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class JwtServiceTest {

    private static final String SECRET = "test-secret-test-secret-test-secret-123";
    private static final Instant NOW = Instant.parse("2026-10-17T20:00:00Z");

    private static JwtService serviceAt(Instant now) {
        return new JwtService(SECRET, 24, Clock.fixed(now, ZoneOffset.UTC));
    }

    @Test
    void tokenRoundTripsUserId() {
        JwtService jwt = serviceAt(NOW);
        assertEquals(Optional.of(42L), jwt.parseUserId(jwt.createToken(42L)));
    }

    @Test
    void expiredTokenIsRejected() {
        String token = serviceAt(NOW).createToken(42L);
        assertTrue(serviceAt(NOW.plus(Duration.ofHours(25))).parseUserId(token).isEmpty());
    }

    @Test
    void tamperedTokenIsRejected() {
        JwtService jwt = serviceAt(NOW);
        String token = jwt.createToken(42L);
        // Change one character of the payload (the middle part). The signature no longer matches.
        int i = token.indexOf('.') + 5;
        char c = token.charAt(i);
        String tampered = token.substring(0, i) + (c == 'A' ? 'B' : 'A') + token.substring(i + 1);
        assertTrue(jwt.parseUserId(tampered).isEmpty());
    }

    @Test
    void garbageIsRejected() {
        assertTrue(serviceAt(NOW).parseUserId("not-a-token").isEmpty());
    }

    @Test
    void shortSecretIsRefused() {
        assertThrows(IllegalStateException.class, () -> new JwtService("too-short", 24, Clock.systemUTC()));
    }
}
