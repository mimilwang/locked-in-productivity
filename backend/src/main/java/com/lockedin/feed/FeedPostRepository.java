package com.lockedin.feed;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FeedPostRepository extends JpaRepository<FeedPost, Long> {
    List<FeedPost> findByLeagueIdOrderByCreatedAtDesc(Long leagueId);
}
