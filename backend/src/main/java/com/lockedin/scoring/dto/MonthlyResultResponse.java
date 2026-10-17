package com.lockedin.scoring.dto;

import java.time.Instant;
import java.util.List;

/** month is "yyyy-MM". reward (MVP) and punishment (Chud) are the plain text the league creator wrote. */
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
