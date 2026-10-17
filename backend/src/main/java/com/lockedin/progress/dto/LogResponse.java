package com.lockedin.progress.dto;

import com.lockedin.progress.LogSource;
import com.lockedin.progress.ProgressLog;
import java.time.Instant;
import java.time.LocalDate;

/** For a running timer, the frontend can show elapsed time as now - startedAt. */
public record LogResponse(
        Long id,
        Long userId,
        Long leagueId,
        Instant startedAt,
        Instant endedAt,
        int durationMinutes,
        LogSource source,
        LocalDate localDate,
        String note,
        boolean running) {

    public static LogResponse from(ProgressLog log) {
        return new LogResponse(log.getId(), log.getUserId(), log.getLeagueId(), log.getStartedAt(),
                log.getEndedAt(), log.getDurationMinutes(), log.getSource(), log.getLocalDate(),
                log.getNote(), log.isRunning());
    }
}
