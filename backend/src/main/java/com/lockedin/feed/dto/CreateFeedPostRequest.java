package com.lockedin.feed.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateFeedPostRequest(
        @NotBlank @Size(max = 280) String body,
        @Size(max = 500) String imageUrl) { }
