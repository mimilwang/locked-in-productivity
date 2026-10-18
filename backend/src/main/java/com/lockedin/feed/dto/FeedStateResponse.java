package com.lockedin.feed.dto;

import java.time.Instant;
import java.util.List;

public record FeedStateResponse(List<Post> posts, List<Reaction> reactions, List<Reply> replies) {
    public record Post(String id, Long userId, String displayName, String body, String imageUrl, Instant createdAt) { }
    public record Reaction(String activityId, Long userId, String emoji) { }
    public record Reply(Long id, String activityId, Long userId, String displayName, String body, Instant createdAt) { }
}
