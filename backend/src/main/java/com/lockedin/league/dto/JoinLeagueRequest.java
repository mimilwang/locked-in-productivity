package com.lockedin.league.dto;

import jakarta.validation.constraints.NotBlank;

/** agreedToRules must be true. avatarUrl is optional (defaults to your profile photo). */
public record JoinLeagueRequest(@NotBlank String inviteCode, String avatarUrl, Boolean agreedToRules) {
}
