package com.lockedin.scoring;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lockedin.common.ApiException;
import com.lockedin.league.League;
import com.lockedin.league.LeagueRepository;
import com.lockedin.league.LeagueService;
import com.lockedin.scoring.dto.LeaderboardEntry;
import com.lockedin.scoring.dto.MonthlyResultResponse;
import java.time.Clock;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Crowns the MVP (1st place) and Chud of the Month (last place) for each calendar month,
 * by adding up the weekly-progress points everyone earned during that month.
 * Runs automatically just after midnight on the 1st (monthly-results.cron), and can be
 * triggered by hand for the demo with POST /leagues/{id}/monthly/finalize.
 */
@Component
public class MonthlyResultsJob {

    private static final Logger log = LoggerFactory.getLogger(MonthlyResultsJob.class);

    private final LeagueRepository leagues;
    private final LeagueService leagueService;
    private final LeaderboardService leaderboardService;
    private final MonthlyResultRepository results;
    private final ObjectMapper objectMapper;
    private final Clock clock;
    private final ZoneId jobZone;

    public MonthlyResultsJob(LeagueRepository leagues, LeagueService leagueService, LeaderboardService leaderboardService,
                             MonthlyResultRepository results, ObjectMapper objectMapper, Clock clock,
                             @Value("${monthly-results.zone:America/Los_Angeles}") String zone) {
        this.leagues = leagues;
        this.leagueService = leagueService;
        this.leaderboardService = leaderboardService;
        this.results = results;
        this.objectMapper = objectMapper;
        this.clock = clock;
        this.jobZone = ZoneId.of(zone);
    }

    @Scheduled(cron = "${monthly-results.cron:0 5 0 1 * *}", zone = "${monthly-results.zone:America/Los_Angeles}")
    public void finalizePreviousMonth() {
        YearMonth previous = YearMonth.now(clock.withZone(jobZone)).minusMonths(1);
        for (League league : leagues.findActiveBetween(previous.atDay(1), previous.atEndOfMonth())) {
            try {
                finalizeMonth(league.getId(), previous, false);
            } catch (Exception e) {
                log.warn("Could not finalize {} for league {}: {}", previous, league.getId(), e.getMessage());
            }
        }
    }

    /**
     * Safe to run twice: with overwrite=false an existing result is returned unchanged.
     * overwrite=true recalculates it (used by the demo endpoint).
     */
    @Transactional
    public MonthlyResultResponse finalizeMonth(Long leagueId, YearMonth month, boolean overwrite) {
        MonthlyResult existing = results.findByLeagueIdAndMonth(leagueId, month.toString()).orElse(null);
        if (existing != null && !overwrite) {
            return toResponse(existing);
        }

        League league = leagueService.getLeague(leagueId);
        List<LeaderboardEntry> standings = leaderboardService.rank(
                league, month.atDay(1), month.atEndOfMonth(), month.atEndOfMonth());
        if (standings.size() < 2) {
            throw ApiException.badRequest("Need at least 2 members to pick an MVP and a Chud");
        }

        LeaderboardEntry mvp = standings.get(0);
        LeaderboardEntry chud = standings.get(standings.size() - 1);

        MonthlyResult result = existing != null ? existing : new MonthlyResult(leagueId, month.toString());
        result.update(mvp.userId(), chud.userId(), toJson(standings), clock.instant());
        return toResponse(results.save(result));
    }

    public MonthlyResultResponse get(Long me, Long leagueId, YearMonth month) {
        leagueService.requireMember(leagueId, me);
        return results.findByLeagueIdAndMonth(leagueId, month.toString())
                .map(this::toResponse)
                .orElseThrow(() -> ApiException.notFound("Results for " + month + " aren't ready yet"));
    }

    public List<MonthlyResultResponse> history(Long me, Long leagueId) {
        leagueService.requireMember(leagueId, me);
        return results.findByLeagueIdOrderByMonthDesc(leagueId).stream().map(this::toResponse).toList();
    }

    private MonthlyResultResponse toResponse(MonthlyResult r) {
        League league = leagueService.getLeague(r.getLeagueId());
        List<LeaderboardEntry> standings = fromJson(r.getStandingsJson());
        LeaderboardEntry mvp = standings.stream().filter(e -> e.userId().equals(r.getMvpUserId())).findFirst().orElse(null);
        LeaderboardEntry chud = standings.stream().filter(e -> e.userId().equals(r.getChudUserId())).findFirst().orElse(null);
        return new MonthlyResultResponse(r.getLeagueId(), r.getMonth(), mvp, chud, league.getReward(),
                league.getPunishment(), standings, r.getFinalizedAt());
    }

    private String toJson(List<LeaderboardEntry> standings) {
        try {
            return objectMapper.writeValueAsString(standings);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Could not save standings", e);
        }
    }

    private List<LeaderboardEntry> fromJson(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<LeaderboardEntry>>() {
            });
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Could not read standings", e);
        }
    }
}
