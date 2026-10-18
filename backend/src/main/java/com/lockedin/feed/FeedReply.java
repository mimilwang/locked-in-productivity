package com.lockedin.feed;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "feed_replies")
public class FeedReply {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false) private Long leagueId;
    @Column(nullable = false, length = 40) private String activityId;
    @Column(nullable = false) private Long userId;
    @Column(nullable = false, length = 280) private String body;
    @Column(nullable = false) private Instant createdAt;

    protected FeedReply() { }

    public FeedReply(Long leagueId, String activityId, Long userId, String body, Instant createdAt) {
        this.leagueId = leagueId;
        this.activityId = activityId;
        this.userId = userId;
        this.body = body;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public Long getLeagueId() { return leagueId; }
    public String getActivityId() { return activityId; }
    public Long getUserId() { return userId; }
    public String getBody() { return body; }
    public Instant getCreatedAt() { return createdAt; }
}
