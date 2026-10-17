package com.lockedin.progress;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;

/**
 * One block of progress. A running timer has endedAt = null.
 * localDate is the day it counts for, in the user's own time zone (the day the timer STARTED).
 */
@Entity
@Table(name = "progress_logs", indexes = {
        @Index(columnList = "league_id"),
        @Index(columnList = "user_id")})
public class ProgressLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "league_id", nullable = false)
    private Long leagueId;

    @Column(nullable = false)
    private Instant startedAt;

    private Instant endedAt;

    @Column(nullable = false)
    private int durationMinutes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LogSource source;

    @Column(nullable = false)
    private LocalDate localDate;

    private String note;

    protected ProgressLog() {
    }

    public ProgressLog(Long userId, Long leagueId, Instant startedAt, Instant endedAt, int durationMinutes,
                       LogSource source, LocalDate localDate, String note) {
        this.userId = userId;
        this.leagueId = leagueId;
        this.startedAt = startedAt;
        this.endedAt = endedAt;
        this.durationMinutes = durationMinutes;
        this.source = source;
        this.localDate = localDate;
        this.note = note;
    }

    public boolean isRunning() {
        return endedAt == null;
    }

    public void stop(Instant endedAt, int durationMinutes) {
        this.endedAt = endedAt;
        this.durationMinutes = durationMinutes;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public Long getLeagueId() {
        return leagueId;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public Instant getEndedAt() {
        return endedAt;
    }

    public int getDurationMinutes() {
        return durationMinutes;
    }

    public LogSource getSource() {
        return source;
    }

    public LocalDate getLocalDate() {
        return localDate;
    }

    public String getNote() {
        return note;
    }
}
