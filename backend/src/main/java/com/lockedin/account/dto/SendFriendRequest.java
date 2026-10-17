package com.lockedin.account.dto;

import jakarta.validation.constraints.Email;

/** Send either userId or email. */
public record SendFriendRequest(Long userId, @Email String email) {
}
