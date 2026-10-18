package com.lockedin.progress.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** A finished daily challenge. points = the challenge's bonus (shown on its card). */
public record CompleteChallengeRequest(
        @NotBlank @Size(max = 60) String challengeId,
        @NotBlank @Size(max = 100) String title,
        @NotNull @Min(1) @Max(100) Integer points,
        @Size(max = 1000) String note) {
}
