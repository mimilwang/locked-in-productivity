package com.lockedin.account.dto;

import com.lockedin.account.Badge;
import com.lockedin.account.ProfileStatsService;
import com.lockedin.account.User;
import java.util.List;

/** email is only filled in for your own profile. */
public record UserProfileResponse(
        Long id,
        String name,
        String displayName,
        String email,
        String school,
        String photoUrl,
        String timeZone,
        int currentStreak,
        int bestStreak,
        List<Badge> badges,
        List<TitleResponse> titles) {

    public static UserProfileResponse of(User user, ProfileStatsService.ProfileStats stats, boolean includePrivate) {
        return new UserProfileResponse(
                user.getId(),
                user.getName(),
                user.getDisplayName(),
                includePrivate ? user.getEmail() : null,
                user.getSchool(),
                user.getProfilePhotoUrl(),
                user.getTimeZone(),
                stats.currentStreak(),
                stats.bestStreak(),
                stats.badges(),
                stats.titles());
    }
}
