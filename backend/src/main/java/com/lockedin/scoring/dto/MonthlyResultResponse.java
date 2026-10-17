package com.lockedin.scoring.dto;

import java.time.Instant;
import java.util.List;

/** month is "yyyy-MM". punishment is what the wheel landed on for the Chud. */
public record MonthlyResultResponse(
        Long leagueId,
        String month,
        LeaderboardEntry mvp,
        LeaderboardEntry chud,
        String reward,
        String punishment,
        List<LeaderboardEntry> standings,
        Instant finalizedAt) {
}
