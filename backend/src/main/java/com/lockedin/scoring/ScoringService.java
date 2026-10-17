package com.lockedin.scoring;

import com.lockedin.league.League;
import com.lockedin.league.LeagueMember;
import com.lockedin.league.LeagueMemberRepository;
import com.lockedin.league.LeagueRepository;
import com.lockedin.progress.ProgressLogRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Keeps the points ledger up to date. Whenever logs or members change, it re-scores the whole league
 * from scratch. Leagues are small (max 15 people), so this is fast and can never drift out of sync.
 */
@Service
public class ScoringService {

    private final LeagueRepository leagues;
    private final LeagueMemberRepository members;
    private final ProgressLogRepository logs;
    private final ScoreEventRepository scoreEvents;
    private final ScoringRules rules;

    public ScoringService(LeagueRepository leagues, LeagueMemberRepository members, ProgressLogRepository logs,
                          ScoreEventRepository scoreEvents, ScoringRules rules) {
        this.leagues = leagues;
        this.members = members;
        this.logs = logs;
        this.scoreEvents = scoreEvents;
        this.rules = rules;
    }

    @Transactional
    public void recalculateLeague(Long leagueId) {
        League league = leagues.findById(leagueId).orElse(null);
        if (league == null) {
            return;
        }
        List<Long> memberIds = members.findByLeagueIdOrderByJoinedAtAsc(leagueId).stream()
                .map(LeagueMember::getUserId)
                .toList();
        List<ScoringEngine.LogEntry> entries = logs.findCompletedByLeagueId(leagueId).stream()
                .map(log -> new ScoringEngine.LogEntry(log.getUserId(), log.getLocalDate(), log.getDurationMinutes()))
                .toList();

        ScoringEngine.Input input = new ScoringEngine.Input(league.getStartDate(), league.getEndDate(),
                league.getGoalType(), league.getWeeklyTarget(), memberIds, entries);
        List<ScoreEvent> events = ScoringEngine.calculate(input, rules).stream()
                .map(a -> new ScoreEvent(leagueId, a.userId(), a.date(), a.points(), a.reason()))
                .toList();

        scoreEvents.deleteByLeagueId(leagueId);
        scoreEvents.saveAll(events);
    }
}
