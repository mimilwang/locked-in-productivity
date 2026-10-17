package com.lockedin.progress.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record StartTimerRequest(@NotNull Long leagueId, @Size(max = 200) String note) {
}
