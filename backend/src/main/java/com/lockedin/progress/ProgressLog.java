package com.lockedin.progress;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

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

    /** Short name for the activity, e.g. "Morning run". */
    @Column(length = 100)
    private String title;

    /** The description. */
    @Column(length = 1000)
    private String note;

    /** For CHALLENGE logs: which daily challenge was completed. */
    @Column(length = 60)
    private String challengeId;

    /** For CHALLENGE logs: bonus points added on top of the weekly goal score. */
    private Integer bonusPoints; // null on older rows = 0

    /**
     * For CHALLENGE logs: the other league member who shared this challenge (if any).
     * Used so undo can remove both linked completions.
     */
    @Column(name = "buddy_user_id")
    private Long buddyUserId;

    /** Up to 4 photos, as URLs returned by POST /images. */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "progress_log_photos", joinColumns = @JoinColumn(name = "log_id"))
    @Column(name = "photo_url", length = 500)
    private List<String> photoUrls = new ArrayList<>();

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

    /** A log with a title and photos (manual logs from the Log activity page). */
    public ProgressLog(Long userId, Long leagueId, Instant startedAt, Instant endedAt, int durationMinutes,
                       LogSource source, LocalDate localDate, String title, String note, List<String> photoUrls) {
        this(userId, leagueId, startedAt, endedAt, durationMinutes, source, localDate, note);
        this.title = title;
        this.photoUrls = photoUrls == null ? new ArrayList<>() : new ArrayList<>(photoUrls);
    }

    /** A completed daily challenge: no minutes, a fixed bonus. */
    public static ProgressLog challenge(Long userId, Long leagueId, Instant now, LocalDate localDate,
                                        String challengeId, String title, String note, int bonusPoints) {
        return challenge(userId, leagueId, now, localDate, challengeId, title, note, bonusPoints, null);
    }

    /** A completed daily challenge shared with a buddy. */
    public static ProgressLog challenge(Long userId, Long leagueId, Instant now, LocalDate localDate,
                                        String challengeId, String title, String note, int bonusPoints,
                                        Long buddyUserId) {
        ProgressLog log = new ProgressLog(userId, leagueId, now, now, 0, LogSource.CHALLENGE, localDate, title, note, null);
        log.challengeId = challengeId;
        log.bonusPoints = bonusPoints;
        log.buddyUserId = buddyUserId;
        return log;
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

    public String getTitle() {
        return title;
    }

    public List<String> getPhotoUrls() {
        return photoUrls;
    }

    public String getChallengeId() {
        return challengeId;
    }

    public int getBonusPoints() {
        return bonusPoints == null ? 0 : bonusPoints;
    }

    public Long getBuddyUserId() {
        return buddyUserId;
    }
}
