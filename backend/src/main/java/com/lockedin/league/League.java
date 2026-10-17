package com.lockedin.league;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "leagues")
public class League {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    /** The group goal in words, e.g. "Study 5 hours a week". */
    @Column(nullable = false)
    private String goalDescription;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GoalType goalType;

    /** What EACH member needs per week: minutes (TIME) or tasks (TASKS). */
    @Column(nullable = false)
    private int weeklyTarget;

    @Column(nullable = false)
    private LocalDate startDate;

    /** Last day of the league (inclusive). */
    @Column(nullable = false)
    private LocalDate endDate;

    @Column(nullable = false, unique = true)
    private String inviteCode;

    private String photoUrl;

    /** What first place (MVP) wins. Plain text, e.g. "Dinner is on everyone else". */
    @Column(nullable = false)
    private String reward;

    /** What last place (Chud) has to do. Plain text. */
    @Column(nullable = false)
    private String punishment;

    @Column(nullable = false)
    private Long creatorId;

    @Column(nullable = false)
    private Instant createdAt;

    protected League() {
    }

    public League(String name, String goalDescription, GoalType goalType, int weeklyTarget,
                  LocalDate startDate, LocalDate endDate, String inviteCode, String photoUrl,
                  String reward, String punishment, Long creatorId, Instant createdAt) {
        this.name = name;
        this.goalDescription = goalDescription;
        this.goalType = goalType;
        this.weeklyTarget = weeklyTarget;
        this.startDate = startDate;
        this.endDate = endDate;
        this.inviteCode = inviteCode;
        this.photoUrl = photoUrl;
        this.reward = reward;
        this.punishment = punishment;
        this.creatorId = creatorId;
        this.createdAt = createdAt;
    }

    /** True if this date is between startDate and endDate (inclusive). */
    public boolean isActiveOn(LocalDate date) {
        return !date.isBefore(startDate) && !date.isAfter(endDate);
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getGoalDescription() {
        return goalDescription;
    }

    public GoalType getGoalType() {
        return goalType;
    }

    public int getWeeklyTarget() {
        return weeklyTarget;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public String getInviteCode() {
        return inviteCode;
    }

    public String getPhotoUrl() {
        return photoUrl;
    }

    public String getReward() {
        return reward;
    }

    public String getPunishment() {
        return punishment;
    }

    public Long getCreatorId() {
        return creatorId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
