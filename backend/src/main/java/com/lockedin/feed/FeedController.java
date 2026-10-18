package com.lockedin.feed;

import com.lockedin.common.CurrentUser;
import com.lockedin.feed.dto.CreateFeedPostRequest;
import com.lockedin.feed.dto.CreateFeedReplyRequest;
import com.lockedin.feed.dto.FeedStateResponse;
import com.lockedin.feed.dto.ToggleReactionRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/leagues/{leagueId}/feed")
public class FeedController {
    private final FeedService feedService;
    private final CurrentUser currentUser;

    public FeedController(FeedService feedService, CurrentUser currentUser) {
        this.feedService = feedService;
        this.currentUser = currentUser;
    }

    @GetMapping
    public FeedStateResponse get(@PathVariable Long leagueId) {
        return feedService.get(currentUser.id(), leagueId);
    }

    @PostMapping("/posts")
    @ResponseStatus(HttpStatus.CREATED)
    public FeedStateResponse.Post post(@PathVariable Long leagueId, @Valid @RequestBody CreateFeedPostRequest request) {
        return feedService.post(currentUser.id(), leagueId, request);
    }

    @PutMapping("/{activityId}/reaction")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void react(@PathVariable Long leagueId, @PathVariable String activityId,
                      @Valid @RequestBody ToggleReactionRequest request) {
        feedService.toggleReaction(currentUser.id(), leagueId, activityId, request);
    }

    @PostMapping("/{activityId}/replies")
    @ResponseStatus(HttpStatus.CREATED)
    public FeedStateResponse.Reply reply(@PathVariable Long leagueId, @PathVariable String activityId,
                                         @Valid @RequestBody CreateFeedReplyRequest request) {
        return feedService.reply(currentUser.id(), leagueId, activityId, request);
    }
}
