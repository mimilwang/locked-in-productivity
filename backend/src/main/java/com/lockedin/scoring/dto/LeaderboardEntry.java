package com.lockedin.scoring.dto;

/**
 * One row of the leaderboard.
 * points  = points earned in the period (daily: gained today; weekly: this week's % of the goal, max 100).
 * minutes / tasks = how much was logged in the period. streak = current streak (display only).
 */
public record LeaderboardEntry(
        int rank,
        Long userId,
        String displayName,
        String avatarUrl,
        int points,
        int minutes,
        int tasks,
        int streak) {
}
