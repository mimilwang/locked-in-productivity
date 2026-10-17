package com.lockedin.league.dto;

import com.lockedin.league.GoalType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;

/**
 * startDate defaults to today; durationWeeks defaults to 4.
 * wheelOptions is the list of punishments on the wheel (optional).
 */
public record CreateLeagueRequest(
        @NotBlank @Size(max = 60) String name,
        @NotBlank @Size(max = 200) String goalDescription,
        @NotNull GoalType goalType,
        @NotNull @Min(1) @Max(10080) Integer weeklyTarget,
        LocalDate startDate,
        @Min(1) @Max(52) Integer durationWeeks,
        String photoUrl,
        @NotBlank @Size(max = 200) String reward,
        @NotBlank @Size(max = 200) String punishment,
        @Size(max = 12) List<@NotBlank @Size(max = 100) String> wheelOptions,
        String avatarUrl) {
}
