package com.lockedin.feed.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateFeedReplyRequest(@NotBlank @Size(max = 280) String body) { }
