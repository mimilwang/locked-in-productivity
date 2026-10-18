package com.lockedin.feed;

import com.lockedin.account.User;
import com.lockedin.account.UserService;
import com.lockedin.common.ApiException;
import com.lockedin.feed.dto.CreateFeedPostRequest;
import com.lockedin.feed.dto.CreateFeedReplyRequest;
import com.lockedin.feed.dto.FeedStateResponse;
import com.lockedin.feed.dto.ToggleReactionRequest;
import com.lockedin.league.LeagueService;
import com.lockedin.progress.ProgressLog;
import com.lockedin.progress.ProgressLogRepository;
import java.time.Clock;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FeedService {
    private static final Set<String> EMOJIS = Set.of("🔥", "👏", "💀", "🔒");
    private final FeedPostRepository posts;
    private final FeedReactionRepository reactions;
    private final FeedReplyRepository replies;
    private final ProgressLogRepository logs;
    private final LeagueService leagueService;
    private final UserService userService;
    private final Clock clock;

    public FeedService(FeedPostRepository posts, FeedReactionRepository reactions, FeedReplyRepository replies,
                       ProgressLogRepository logs, LeagueService leagueService, UserService userService, Clock clock) {
        this.posts = posts;
        this.reactions = reactions;
        this.replies = replies;
        this.logs = logs;
        this.leagueService = leagueService;
        this.userService = userService;
        this.clock = clock;
    }

    public FeedStateResponse get(Long me, Long leagueId) {
        leagueService.requireMember(leagueId, me);
        List<FeedPost> leaguePosts = posts.findByLeagueIdOrderByCreatedAtDesc(leagueId);
        List<FeedReaction> leagueReactions = reactions.findByLeagueId(leagueId);
        List<FeedReply> leagueReplies = replies.findByLeagueIdOrderByCreatedAtAsc(leagueId);
        Set<Long> userIds = new HashSet<>();
        leaguePosts.forEach(item -> userIds.add(item.getUserId()));
        leagueReplies.forEach(item -> userIds.add(item.getUserId()));
        Map<Long, User> users = userService.getAll(userIds);
        return new FeedStateResponse(
                leaguePosts.stream().map(item -> new FeedStateResponse.Post("post-" + item.getId(), item.getUserId(),
                        displayName(users, item.getUserId()), item.getBody(), item.getImageUrl(), item.getCreatedAt())).toList(),
                leagueReactions.stream().map(item -> new FeedStateResponse.Reaction(item.getActivityId(),
                        item.getUserId(), item.getEmoji())).toList(),
                leagueReplies.stream().map(item -> new FeedStateResponse.Reply(item.getId(), item.getActivityId(),
                        item.getUserId(), displayName(users, item.getUserId()), item.getBody(), item.getCreatedAt())).toList());
    }

    @Transactional
    public FeedStateResponse.Post post(Long me, Long leagueId, CreateFeedPostRequest request) {
        leagueService.requireMember(leagueId, me);
        User user = userService.get(me);
        String imageUrl = request.imageUrl() == null || request.imageUrl().isBlank() ? null : request.imageUrl().trim();
        FeedPost saved = posts.save(new FeedPost(leagueId, me, request.body().trim(), imageUrl, clock.instant()));
        return new FeedStateResponse.Post("post-" + saved.getId(), me, user.getDisplayName(), saved.getBody(),
                saved.getImageUrl(), saved.getCreatedAt());
    }

    @Transactional
    public void toggleReaction(Long me, Long leagueId, String activityId, ToggleReactionRequest request) {
        leagueService.requireMember(leagueId, me);
        requireActivity(leagueId, activityId);
        if (!EMOJIS.contains(request.emoji())) throw ApiException.badRequest("Unsupported reaction");
        FeedReaction existing = reactions.findByLeagueIdAndActivityIdAndUserId(leagueId, activityId, me).orElse(null);
        if (existing != null && existing.getEmoji().equals(request.emoji())) {
            reactions.delete(existing);
        } else if (existing != null) {
            existing.setEmoji(request.emoji());
        } else {
            reactions.save(new FeedReaction(leagueId, activityId, me, request.emoji()));
        }
    }

    @Transactional
    public FeedStateResponse.Reply reply(Long me, Long leagueId, String activityId, CreateFeedReplyRequest request) {
        leagueService.requireMember(leagueId, me);
        requireActivity(leagueId, activityId);
        User user = userService.get(me);
        FeedReply saved = replies.save(new FeedReply(leagueId, activityId, me, request.body().trim(), clock.instant()));
        return new FeedStateResponse.Reply(saved.getId(), activityId, me, user.getDisplayName(), saved.getBody(), saved.getCreatedAt());
    }

    private void requireActivity(Long leagueId, String activityId) {
        try {
            if (activityId.startsWith("log-")) {
                ProgressLog log = logs.findById(Long.valueOf(activityId.substring(4)))
                        .orElseThrow(() -> ApiException.notFound("Feed activity not found"));
                if (!log.getLeagueId().equals(leagueId)) throw ApiException.notFound("Feed activity not found");
                return;
            }
            if (activityId.startsWith("post-")) {
                FeedPost post = posts.findById(Long.valueOf(activityId.substring(5)))
                        .orElseThrow(() -> ApiException.notFound("Feed activity not found"));
                if (!post.getLeagueId().equals(leagueId)) throw ApiException.notFound("Feed activity not found");
                return;
            }
        } catch (NumberFormatException ignored) {
            // handled by the consistent bad request below
        }
        throw ApiException.badRequest("Invalid feed activity");
    }

    private static String displayName(Map<Long, User> users, Long userId) {
        User user = users.get(userId);
        return user == null ? "A member" : user.getDisplayName();
    }
}
