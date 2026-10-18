package com.lockedin.account;

import com.lockedin.account.dto.UpdateProfileRequest;
import com.lockedin.account.dto.UserProfileResponse;
import com.lockedin.common.ApiException;
import com.lockedin.common.TimeUtils;
import java.time.ZoneId;
import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Looks up users. Other packages call this instead of touching the users table directly. */
@Service
public class UserService {

    private final UserRepository users;
    private final ProfileStatsService stats;

    public UserService(UserRepository users, ProfileStatsService stats) {
        this.users = users;
        this.stats = stats;
    }

    public User get(Long userId) {
        return users.findById(userId).orElseThrow(() -> ApiException.notFound("User not found"));
    }

    public Optional<User> findByEmail(String email) {
        return users.findByEmailIgnoreCase(email.trim());
    }

    public ZoneId zoneOf(Long userId) {
        return TimeUtils.zone(get(userId).getTimeZone());
    }

    public Map<Long, User> getAll(Collection<Long> userIds) {
        return users.findAllById(userIds).stream().collect(Collectors.toMap(User::getId, Function.identity()));
    }

    /** includePrivate = true for your own profile (shows your email). */
    public UserProfileResponse profile(Long userId, boolean includePrivate) {
        User user = get(userId);
        ProfileStatsService.ProfileStats s = stats.forUser(userId, TimeUtils.zone(user.getTimeZone()));
        return UserProfileResponse.of(user, s, includePrivate);
    }

    @Transactional
    public UserProfileResponse update(Long userId, UpdateProfileRequest request) {
        User user = get(userId);
        if (request.name() != null) {
            if (request.name().isBlank()) {
                throw ApiException.badRequest("Name can't be empty");
            }
            user.setName(request.name().trim());
        }
        if (request.displayName() != null) {
            if (request.displayName().isBlank()) {
                throw ApiException.badRequest("Display name can't be empty");
            }
            user.setDisplayName(request.displayName().trim());
        }
        if (request.timeZone() != null) {
            if (!TimeUtils.isValidZone(request.timeZone())) {
                throw ApiException.badRequest("Unknown time zone: " + request.timeZone());
            }
            user.setTimeZone(request.timeZone());
        }
        if (request.photoUrl() != null) {
            user.setProfilePhotoUrl(request.photoUrl().isBlank() ? null : request.photoUrl());
        }
        if (request.school() != null) {
            user.setSchool(request.school().isBlank() ? null : request.school().trim());
        }
        return profile(userId, true);
    }
}
