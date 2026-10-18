package com.lockedin.feed;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FeedReactionRepository extends JpaRepository<FeedReaction, Long> {
    List<FeedReaction> findByLeagueId(Long leagueId);
    Optional<FeedReaction> findByLeagueIdAndActivityIdAndUserId(Long leagueId, String activityId, Long userId);
}
