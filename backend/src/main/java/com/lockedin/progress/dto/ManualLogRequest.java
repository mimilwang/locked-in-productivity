package com.lockedin.progress.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;

/**
 * TIME leagues: minutes is required (the frontend can turn "1.5 hours" into 90).
 * TASKS leagues: each log is 1 completed task; minutes is optional.
 * date defaults to today (in your time zone).
 * title, note (the description) and photoUrls (from POST /images, max 4) are optional.
 */
public record ManualLogRequest(
        @NotNull Long leagueId,
        @Min(0) Integer minutes,
        LocalDate date,
        @Size(max = 1000) String note,
        @Size(max = 100) String title,
        @Size(max = 4) List<@Size(max = 500) String> photoUrls) {

    /** Shorter form without title or photos. */
    public ManualLogRequest(Long leagueId, Integer minutes, LocalDate date, String note) {
        this(leagueId, minutes, date, note, null, null);
    }
}
