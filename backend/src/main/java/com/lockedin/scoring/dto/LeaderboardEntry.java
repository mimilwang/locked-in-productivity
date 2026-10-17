package com.lockedin.scoring.dto;

/** One row of the leaderboard. minutes = minutes logged in the period; streak = current streak. */
public record LeaderboardEntry(
        int rank,
        Long userId,
        String displayName,
        String avatarUrl,
        int points,
        int minutes,
        int streak) {
}
