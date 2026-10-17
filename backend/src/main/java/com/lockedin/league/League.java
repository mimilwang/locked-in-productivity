package com.lockedin.league;

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
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

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

    /** What each member needs per week: minutes or sessions, depending on goalType. */
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

    /** What first place wins. */
    @Column(nullable = false)
    private String reward;

    /** What last place has to do. */
    @Column(nullable = false)
    private String punishment;

    /** Options on the punishment wheel. If empty, the Chud just gets `punishment`. */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "league_wheel_options", joinColumns = @JoinColumn(name = "league_id"))
    @Column(name = "option_text")
    private List<String> wheelOptions = new ArrayList<>();

    @Column(nullable = false)
    private Long creatorId;

    @Column(nullable = false)
    private Instant createdAt;

    protected League() {
    }

    public League(String name, String goalDescription, GoalType goalType, int weeklyTarget,
                  LocalDate startDate, LocalDate endDate, String inviteCode, String photoUrl,
                  String reward, String punishment, List<String> wheelOptions, Long creatorId, Instant createdAt) {
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
        this.wheelOptions = wheelOptions == null ? new ArrayList<>() : new ArrayList<>(wheelOptions);
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

    public List<String> getWheelOptions() {
        return wheelOptions;
    }

    public Long getCreatorId() {
        return creatorId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
