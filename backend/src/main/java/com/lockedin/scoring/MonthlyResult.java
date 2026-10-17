package com.lockedin.scoring;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;

/** The final standings for one league and one month, with its MVP and Chud. */
@Entity
@Table(name = "monthly_results",
        uniqueConstraints = @UniqueConstraint(columnNames = {"league_id", "result_month"}))
public class MonthlyResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "league_id", nullable = false)
    private Long leagueId;

    /** "yyyy-MM", e.g. "2026-10". */
    @Column(name = "result_month", nullable = false)
    private String month;

    private Long mvpUserId;

    private Long chudUserId;

    /** Full standings as JSON (a list of LeaderboardEntry). */
    @Column(length = 20000)
    private String standingsJson;

    private Instant finalizedAt;

    protected MonthlyResult() {
    }

    public MonthlyResult(Long leagueId, String month) {
        this.leagueId = leagueId;
        this.month = month;
    }

    public void update(Long mvpUserId, Long chudUserId, String standingsJson, Instant finalizedAt) {
        this.mvpUserId = mvpUserId;
        this.chudUserId = chudUserId;
        this.standingsJson = standingsJson;
        this.finalizedAt = finalizedAt;
    }

    public Long getId() {
        return id;
    }

    public Long getLeagueId() {
        return leagueId;
    }

    public String getMonth() {
        return month;
    }

    public Long getMvpUserId() {
        return mvpUserId;
    }

    public Long getChudUserId() {
        return chudUserId;
    }

    public String getStandingsJson() {
        return standingsJson;
    }

    public Instant getFinalizedAt() {
        return finalizedAt;
    }
}
