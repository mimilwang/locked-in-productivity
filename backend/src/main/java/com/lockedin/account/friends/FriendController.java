package com.lockedin.account.friends;

import com.lockedin.account.dto.FriendResponse;
import com.lockedin.account.dto.SendFriendRequest;
import com.lockedin.common.CurrentUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/friends")
@Tag(name = "Friends")
public class FriendController {

    private final FriendService friendService;
    private final CurrentUser currentUser;

    public FriendController(FriendService friendService, CurrentUser currentUser) {
        this.friendService = friendService;
        this.currentUser = currentUser;
    }

    @GetMapping
    @Operation(summary = "Your friends")
    public List<FriendResponse> friends() {
        return friendService.listFriends(currentUser.id());
    }

    @GetMapping("/requests")
    @Operation(summary = "Friend requests waiting for your answer")
    public List<FriendResponse> incoming() {
        return friendService.incomingRequests(currentUser.id());
    }

    @PostMapping("/requests")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Send a friend request by userId or email")
    public FriendResponse send(@Valid @RequestBody SendFriendRequest request) {
        return friendService.sendRequest(currentUser.id(), request);
    }

    @PostMapping("/requests/{requestId}/accept")
    @Operation(summary = "Accept a friend request")
    public FriendResponse accept(@PathVariable Long requestId) {
        return friendService.accept(currentUser.id(), requestId);
    }

    @PostMapping("/requests/{requestId}/decline")
    @Operation(summary = "Decline a friend request")
    public FriendResponse decline(@PathVariable Long requestId) {
        return friendService.decline(currentUser.id(), requestId);
    }
}
