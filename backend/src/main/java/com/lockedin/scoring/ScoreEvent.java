package com.lockedin.scoring;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.LocalDate;

/**
 * The points ledger: one row per "you got X points on day D because of R".
 * Totals for any day/week/month are just a sum over a date range.
 */
@Entity
@Table(name = "score_events", indexes = @Index(columnList = "league_id, score_date"))
public class ScoreEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "league_id", nullable = false)
    private Long leagueId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "score_date", nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private int points;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ScoreReason reason;

    protected ScoreEvent() {
    }

    public ScoreEvent(Long leagueId, Long userId, LocalDate date, int points, ScoreReason reason) {
        this.leagueId = leagueId;
        this.userId = userId;
        this.date = date;
        this.points = points;
        this.reason = reason;
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

    public LocalDate getDate() {
        return date;
    }

    public int getPoints() {
        return points;
    }

    public ScoreReason getReason() {
        return reason;
    }
}
