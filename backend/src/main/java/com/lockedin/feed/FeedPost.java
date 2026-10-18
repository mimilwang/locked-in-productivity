package com.lockedin.feed;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "feed_posts")
public class FeedPost {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false) private Long leagueId;
    @Column(nullable = false) private Long userId;
    @Column(nullable = false, length = 280) private String body;
    @Column(length = 500) private String imageUrl;
    @Column(nullable = false) private Instant createdAt;

    protected FeedPost() { }

    public FeedPost(Long leagueId, Long userId, String body, String imageUrl, Instant createdAt) {
        this.leagueId = leagueId;
        this.userId = userId;
        this.body = body;
        this.imageUrl = imageUrl;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public Long getLeagueId() { return leagueId; }
    public Long getUserId() { return userId; }
    public String getBody() { return body; }
    public String getImageUrl() { return imageUrl; }
    public Instant getCreatedAt() { return createdAt; }
}
