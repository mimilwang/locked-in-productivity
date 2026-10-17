package com.lockedin.account.dto;

import com.lockedin.account.friends.FriendshipStatus;

/** requestId is what you pass to accept/decline. userId is the OTHER person. */
public record FriendResponse(Long requestId, Long userId, String displayName, String photoUrl, FriendshipStatus status) {
}
