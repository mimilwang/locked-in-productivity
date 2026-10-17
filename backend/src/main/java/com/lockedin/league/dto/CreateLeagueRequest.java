package com.lockedin.league.dto;

import com.lockedin.league.GoalType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/**
 * One goal for the whole league; every member has to hit it on their own each week.
 * goalType TIME: weeklyTarget in minutes (5 hours = 300). goalType TASKS: weeklyTarget in tasks.
 * reward / punishment are plain text the frontend displays however it likes.
 * startDate defaults to today; durationWeeks defaults to 4.
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
        String avatarUrl) {
}
