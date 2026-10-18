package com.lockedin.account.auth;

import com.lockedin.account.User;
import com.lockedin.account.UserRepository;
import com.lockedin.account.UserService;
import com.lockedin.account.dto.AuthResponse;
import com.lockedin.account.dto.LoginRequest;
import com.lockedin.account.dto.SignUpRequest;
import com.lockedin.common.ApiException;
import com.lockedin.common.TimeUtils;
import java.time.Clock;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository users;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final Clock clock;

    public AuthService(UserRepository users, UserService userService, PasswordEncoder passwordEncoder,
                       JwtService jwtService, Clock clock) {
        this.users = users;
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.clock = clock;
    }

    @Transactional
    public AuthResponse signUp(SignUpRequest request) {
        String email = request.email().trim().toLowerCase();
        if (users.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("An account with that email already exists");
        }
        if (!TimeUtils.isValidZone(request.timeZone())) {
            throw ApiException.badRequest("Unknown time zone: " + request.timeZone());
        }

        User user = new User(
                request.name().trim(),
                request.displayName().trim(),
                email,
                passwordEncoder.encode(request.password()), // never store the real password
                request.timeZone(),
                clock.instant());
        user.setProfilePhotoUrl(request.photoUrl());
        user.setSchool(request.school() == null || request.school().isBlank() ? null : request.school().trim());
        users.save(user);

        return new AuthResponse(jwtService.createToken(user.getId()), userService.profile(user.getId(), true));
    }

    public AuthResponse logIn(LoginRequest request) {
        User user = users.findByEmailIgnoreCase(request.email().trim())
                .filter(u -> passwordEncoder.matches(request.password(), u.getPasswordHash()))
                // same message either way, so nobody can test which emails have accounts
                .orElseThrow(() -> ApiException.unauthorized("Wrong email or password"));
        return new AuthResponse(jwtService.createToken(user.getId()), userService.profile(user.getId(), true));
    }
}
