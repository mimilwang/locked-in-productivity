package com.lockedin.league;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;

/** Links a user to a league. One row per (league, user). */
@Entity
@Table(name = "league_members",
        uniqueConstraints = @UniqueConstraint(columnNames = {"league_id", "user_id"}))
public class LeagueMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "league_id", nullable = false)
    private Long leagueId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** Optional league-specific avatar. If null, the user's profile photo is used. */
    private String avatarUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MemberRole role;

    @Column(nullable = false)
    private Instant rulesAgreedAt;

    @Column(nullable = false)
    private Instant joinedAt;

    protected LeagueMember() {
    }

    public LeagueMember(Long leagueId, Long userId, String avatarUrl, MemberRole role,
                        Instant rulesAgreedAt, Instant joinedAt) {
        this.leagueId = leagueId;
        this.userId = userId;
        this.avatarUrl = avatarUrl;
        this.role = role;
        this.rulesAgreedAt = rulesAgreedAt;
        this.joinedAt = joinedAt;
    }

    public Long getId() {
        return id;
    }

    public Long getLeagueId() {
        return leagueId;
    }

    public Long getUserId() {
        return userId;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public MemberRole getRole() {
        return role;
    }

    public Instant getRulesAgreedAt() {
        return rulesAgreedAt;
    }

    public Instant getJoinedAt() {
        return joinedAt;
    }
}
