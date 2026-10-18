package com.lockedin.account.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SignUpRequest(
        @NotBlank @Size(max = 80) String name,
        @NotBlank @Size(max = 40) String displayName,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, max = 100) String password,
        @NotBlank String timeZone,
        String photoUrl,
        @Size(max = 120) String school) {
}
