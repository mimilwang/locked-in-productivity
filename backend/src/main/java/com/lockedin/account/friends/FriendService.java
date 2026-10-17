package com.lockedin.account.friends;

import com.lockedin.account.User;
import com.lockedin.account.UserService;
import com.lockedin.account.dto.FriendResponse;
import com.lockedin.account.dto.SendFriendRequest;
import com.lockedin.common.ApiException;
import java.time.Clock;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FriendService {

    private final FriendshipRepository friendships;
    private final UserService userService;
    private final Clock clock;

    public FriendService(FriendshipRepository friendships, UserService userService, Clock clock) {
        this.friendships = friendships;
        this.userService = userService;
        this.clock = clock;
    }

    @Transactional
    public FriendResponse sendRequest(Long me, SendFriendRequest request) {
        userService.get(me);
        User target = findTarget(request);
        if (target.getId().equals(me)) {
            throw ApiException.badRequest("You can't add yourself as a friend");
        }

        Optional<Friendship> mine = friendships.findByRequesterIdAndAddresseeId(me, target.getId());
        Optional<Friendship> theirs = friendships.findByRequesterIdAndAddresseeId(target.getId(), me);

        boolean alreadyFriends = mine.map(f -> f.getStatus() == FriendshipStatus.ACCEPTED).orElse(false)
                || theirs.map(f -> f.getStatus() == FriendshipStatus.ACCEPTED).orElse(false);
        if (alreadyFriends) {
            throw ApiException.conflict("You're already friends");
        }

        // They already asked you: sending one back just accepts theirs.
        if (theirs.isPresent() && theirs.get().getStatus() == FriendshipStatus.PENDING) {
            theirs.get().accept(clock.instant());
            return toResponse(theirs.get(), target);
        }

        if (mine.isPresent()) {
            Friendship existing = mine.get();
            if (existing.getStatus() == FriendshipStatus.PENDING) {
                throw ApiException.conflict("Friend request already sent");
            }
            existing.reopen(clock.instant()); // was declined before; ask again
            return toResponse(existing, target);
        }

        Friendship created = friendships.save(new Friendship(me, target.getId(), clock.instant()));
        return toResponse(created, target);
    }

    @Transactional
    public FriendResponse accept(Long me, Long requestId) {
        Friendship f = getIncomingPending(me, requestId);
        f.accept(clock.instant());
        return toResponse(f, userService.get(f.getRequesterId()));
    }

    @Transactional
    public FriendResponse decline(Long me, Long requestId) {
        Friendship f = getIncomingPending(me, requestId);
        f.decline(clock.instant());
        return toResponse(f, userService.get(f.getRequesterId()));
    }

    public List<FriendResponse> listFriends(Long me) {
        List<Friendship> accepted = friendships.findByUserAndStatus(me, FriendshipStatus.ACCEPTED);
        Map<Long, User> users = userService.getAll(accepted.stream().map(f -> f.otherUser(me)).toList());
        return accepted.stream()
                .filter(f -> users.containsKey(f.otherUser(me)))
                .map(f -> toResponse(f, users.get(f.otherUser(me))))
                .toList();
    }

    public List<FriendResponse> incomingRequests(Long me) {
        List<Friendship> pending = friendships.findByAddresseeIdAndStatus(me, FriendshipStatus.PENDING);
        Map<Long, User> users = userService.getAll(pending.stream().map(Friendship::getRequesterId).toList());
        return pending.stream()
                .filter(f -> users.containsKey(f.getRequesterId()))
                .map(f -> toResponse(f, users.get(f.getRequesterId())))
                .toList();
    }

    private Friendship getIncomingPending(Long me, Long requestId) {
        Friendship f = friendships.findById(requestId)
                .orElseThrow(() -> ApiException.notFound("Friend request not found"));
        if (!f.getAddresseeId().equals(me)) {
            throw ApiException.forbidden("This friend request isn't for you");
        }
        if (f.getStatus() != FriendshipStatus.PENDING) {
            throw ApiException.badRequest("This friend request was already answered");
        }
        return f;
    }

    private User findTarget(SendFriendRequest request) {
        if (request.userId() != null) {
            return userService.get(request.userId());
        }
        if (request.email() != null && !request.email().isBlank()) {
            return userService.findByEmail(request.email())
                    .orElseThrow(() -> ApiException.notFound("No user with that email"));
        }
        throw ApiException.badRequest("Send a userId or an email");
    }

    private FriendResponse toResponse(Friendship f, User other) {
        return new FriendResponse(f.getId(), other.getId(), other.getDisplayName(), other.getProfilePhotoUrl(), f.getStatus());
    }
}
