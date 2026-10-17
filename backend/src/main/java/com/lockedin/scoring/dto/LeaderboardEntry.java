package com.lockedin.scoring.dto;

/**
 * One row of the leaderboard.
 * points        = points earned in the period (daily: gained today; weekly: 0-100; monthly: total this month).
 * weeklyPercent = this week's progress toward the goal, 0-100 (same in every period, e.g. "+25 today, 65% of goal").
 * minutes / tasks = how much was logged in the period. streak = current streak (display only).
 * standing      = LEADER (1st), CHUD_ZONE (last) or NONE.
 */
public record LeaderboardEntry(
        int rank,
        Long userId,
        String displayName,
        String avatarUrl,
        int points,
        int weeklyPercent,
        int minutes,
        int tasks,
        int streak,
        Standing standing) {
}
