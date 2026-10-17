package com.lockedin.account.dto;

/** Send the token on every request after this: "Authorization: Bearer <token>". */
public record AuthResponse(String token, UserProfileResponse user) {
}
