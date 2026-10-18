package com.lockedin.feed.dto;

import jakarta.validation.constraints.NotBlank;

public record ToggleReactionRequest(@NotBlank String emoji) { }
