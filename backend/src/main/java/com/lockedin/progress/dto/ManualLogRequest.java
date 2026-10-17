package com.lockedin.progress.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/** date defaults to today (in your time zone). */
public record ManualLogRequest(
        @NotNull Long leagueId,
        @NotNull @Min(1) Integer minutes,
        LocalDate date,
        @Size(max = 200) String note) {
}
