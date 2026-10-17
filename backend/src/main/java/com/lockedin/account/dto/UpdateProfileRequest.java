package com.lockedin.account.dto;

import jakarta.validation.constraints.Size;

/** Every field is optional. Leave a field out (null) to keep its current value. */
public record UpdateProfileRequest(
        @Size(max = 80) String name,
        @Size(max = 40) String displayName,
        String timeZone,
        String photoUrl) {
}
