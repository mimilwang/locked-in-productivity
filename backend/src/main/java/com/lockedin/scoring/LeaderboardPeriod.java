package com.lockedin.scoring;

import com.lockedin.common.ApiException;

public enum LeaderboardPeriod {
    DAILY,
    WEEKLY,
    MONTHLY,
    TOTAL;

    /** Accepts "daily", "Weekly", etc. */
    public static LeaderboardPeriod parse(String value) {
        try {
            return LeaderboardPeriod.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("period must be daily, weekly, monthly or total");
        }
    }
}
