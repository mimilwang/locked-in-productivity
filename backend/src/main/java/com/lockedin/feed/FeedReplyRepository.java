package com.lockedin.feed;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FeedReplyRepository extends JpaRepository<FeedReply, Long> {
    List<FeedReply> findByLeagueIdOrderByCreatedAtAsc(Long leagueId);
}
