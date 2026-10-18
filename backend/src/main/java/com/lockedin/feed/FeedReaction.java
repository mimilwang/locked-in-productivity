package com.lockedin.feed;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "feed_reactions", uniqueConstraints =
        @UniqueConstraint(columnNames = {"league_id", "activity_id", "user_id"}))
public class FeedReaction {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false) private Long leagueId;
    @Column(nullable = false, length = 40) private String activityId;
    @Column(nullable = false) private Long userId;
    @Column(nullable = false, length = 8) private String emoji;

    protected FeedReaction() { }

    public FeedReaction(Long leagueId, String activityId, Long userId, String emoji) {
        this.leagueId = leagueId;
        this.activityId = activityId;
        this.userId = userId;
        this.emoji = emoji;
    }

    public Long getLeagueId() { return leagueId; }
    public String getActivityId() { return activityId; }
    public Long getUserId() { return userId; }
    public String getEmoji() { return emoji; }
    public void setEmoji(String emoji) { this.emoji = emoji; }
}
