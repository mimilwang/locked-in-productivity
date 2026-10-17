package com.lockedin.account;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.lockedin.account.auth.AuthService;
import com.lockedin.account.auth.JwtService;
import com.lockedin.account.dto.AuthResponse;
import com.lockedin.account.dto.LoginRequest;
import com.lockedin.account.dto.SignUpRequest;
import com.lockedin.common.ApiException;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class AuthServiceTest {

    @Autowired
    AuthService auth;
    @Autowired
    UserRepository users;
    @Autowired
    JwtService jwt;

    private SignUpRequest signUp(String email, String timeZone) {
        return new SignUpRequest("Renee", "renee", email, "password123", timeZone, null);
    }

    @Test
    void signUpReturnsWorkingToken() {
        AuthResponse response = auth.signUp(signUp("renee@test.com", "America/Los_Angeles"));
        assertEquals(Optional.of(response.user().id()), jwt.parseUserId(response.token()));
        assertEquals("renee@test.com", response.user().email());
    }

    @Test
    void duplicateEmailRejectedEvenWithDifferentCase() {
        auth.signUp(signUp("renee@test.com", "America/Los_Angeles"));
        ApiException e = assertThrows(ApiException.class, () -> auth.signUp(signUp("RENEE@test.com", "America/Los_Angeles")));
        assertEquals(HttpStatus.CONFLICT, e.getStatus());
    }

    @Test
    void passwordIsHashed() {
        auth.signUp(signUp("renee@test.com", "America/Los_Angeles"));
        User user = users.findByEmailIgnoreCase("renee@test.com").orElseThrow();
        assertNotEquals("password123", user.getPasswordHash());
        assertTrue(user.getPasswordHash().startsWith("$2")); // BCrypt
    }

    @Test
    void invalidTimeZoneRejected() {
        ApiException e = assertThrows(ApiException.class, () -> auth.signUp(signUp("renee@test.com", "Mars/Olympus")));
        assertEquals(HttpStatus.BAD_REQUEST, e.getStatus());
    }

    @Test
    void loginWorksWithRightPassword() {
        Long id = auth.signUp(signUp("renee@test.com", "America/Los_Angeles")).user().id();
        AuthResponse response = auth.logIn(new LoginRequest("renee@test.com", "password123"));
        assertEquals(Optional.of(id), jwt.parseUserId(response.token()));
    }

    @Test
    void wrongPasswordRejected() {
        auth.signUp(signUp("renee@test.com", "America/Los_Angeles"));
        ApiException e = assertThrows(ApiException.class, () -> auth.logIn(new LoginRequest("renee@test.com", "nope12345")));
        assertEquals(HttpStatus.UNAUTHORIZED, e.getStatus());
    }

    @Test
    void unknownEmailGetsSameMessageAsWrongPassword() {
        ApiException e = assertThrows(ApiException.class, () -> auth.logIn(new LoginRequest("nobody@test.com", "password123")));
        assertEquals("Wrong email or password", e.getMessage());
    }
}
