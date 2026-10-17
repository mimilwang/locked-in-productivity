package com.lockedin.progress.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/**
 * TIME leagues: minutes is required (the frontend can turn "1.5 hours" into 90).
 * TASKS leagues: each log is 1 completed task; minutes is optional.
 * date defaults to today (in your time zone).
 */
public record ManualLogRequest(
        @NotNull Long leagueId,
        @Min(0) Integer minutes,
        LocalDate date,
        @Size(max = 200) String note) {
}
