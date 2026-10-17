package com.lockedin.league.dto;

import com.lockedin.league.MemberRole;
import java.time.Instant;

public record MemberResponse(Long userId, String displayName, String avatarUrl, MemberRole role, Instant joinedAt) {
}
