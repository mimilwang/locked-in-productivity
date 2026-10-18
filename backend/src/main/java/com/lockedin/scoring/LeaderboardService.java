package com.lockedin.scoring;

import com.lockedin.account.User;
import com.lockedin.account.UserService;
import com.lockedin.common.TimeUtils;
import com.lockedin.league.GoalType;
import com.lockedin.league.League;
import com.lockedin.league.LeagueMember;
import com.lockedin.league.LeagueService;
import com.lockedin.progress.LogSource;
import com.lockedin.progress.ProgressLog;
import com.lockedin.progress.ProgressLogRepository;
import com.lockedin.scoring.dto.LeaderboardEntry;
import com.lockedin.scoring.dto.LeagueOverview;
import com.lockedin.scoring.dto.ScoreEventResponse;
import com.lockedin.scoring.dto.Standing;
import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;

/**
 * Rankings. Ties are broken by: more points, then more progress (minutes or tasks), then longer streak,
 * then who joined first.
 * Every member gets a unique rank (1, 2, 3...), so first and last place are always clear.
 */
@Service
public class LeaderboardService {

    private final LeagueService leagueService;
    private final UserService userService;
    private final ScoreEventRepository scoreEvents;
    private final ProgressLogRepository logs;
    private final ScoringRules rules;
    private final Clock clock;

    public LeaderboardService(LeagueService leagueService, UserService userService, ScoreEventRepository scoreEvents,
                              ProgressLogRepository logs, ScoringRules rules, Clock clock) {
        this.leagueService = leagueService;
        this.userService = userService;
        this.scoreEvents = scoreEvents;
        this.logs = logs;
        this.rules = rules;
        this.clock = clock;
    }

    public List<LeaderboardEntry> leaderboard(Long me, Long leagueId, LeaderboardPeriod period) {
        leagueService.requireMember(leagueId, me);
        League league = leagueService.getLeague(leagueId);
        LocalDate today = TimeUtils.today(clock, userService.zoneOf(me));
        LocalDate[] range = rangeFor(period, today, league);
        return rank(league, range[0], range[1], today);
    }

    public LeagueOverview overview(Long me, Long leagueId) {
        leagueService.requireMember(leagueId, me);
        League league = leagueService.getLeague(leagueId);
        LocalDate today = TimeUtils.today(clock, userService.zoneOf(me));
        LocalDate weekStart = TimeUtils.weekStart(today, rules.weekStartsOn());
        LocalDate weekEnd = weekStart.plusDays(6);

        List<LeaderboardEntry> daily = rank(league, today, today, today);
        List<LeaderboardEntry> weekly = rank(league, weekStart, weekEnd, today);
        LeaderboardEntry todaysLeader = daily.isEmpty() || daily.get(0).points() == 0 ? null : daily.get(0);

        // Weekly goal progress per member (minutes or sessions, depending on the goal type).
        Map<Long, Integer> progress = new HashMap<>();
        int totalMinutes = 0;
        for (ProgressLog log : logs.findCompletedByLeagueId(leagueId)) {
            if (log.getLocalDate().isBefore(weekStart) || log.getLocalDate().isAfter(weekEnd)) {
                continue;
            }
            int amount = ScoringEngine.amountFor(league.getGoalType(), log.getDurationMinutes());
            if (amount > 0) {
                progress.merge(log.getUserId(), amount, Integer::sum);
            }
            totalMinutes += log.getDurationMinutes();
        }
        List<LeagueMember> members = leagueService.getMembers(leagueId);
        int hit = (int) members.stream()
                .filter(m -> progress.getOrDefault(m.getUserId(), 0) >= league.getWeeklyTarget())
                .count();
        double groupProgress = members.isEmpty() ? 0.0 : (double) hit / members.size();
        long daysLeft = Math.max(0, ChronoUnit.DAYS.between(today, league.getEndDate()) + 1);

        return new LeagueOverview(league.getId(), league.getName(), league.getGoalDescription(), league.getGoalType(),
                league.getWeeklyTarget(), weekStart, weekEnd, todaysLeader, weekly, totalMinutes, hit, members.size(),
                groupProgress, progress.getOrDefault(me, 0), daysLeft);
    }

    /** Point-by-point breakdown for one member (defaults to you). */
    public List<ScoreEventResponse> breakdown(Long me, Long leagueId, Long userId) {
        leagueService.requireMember(leagueId, me);
        Long target = userId != null ? userId : me;
        return scoreEvents.findByLeagueIdAndUserIdOrderByDateAsc(leagueId, target).stream()
                .map(e -> new ScoreEventResponse(e.getDate(), e.getPoints(), e.getReason()))
                .toList();
    }

    /** Rank every member by points earned between from and to (inclusive). Streaks are as of asOf. */
    public List<LeaderboardEntry> rank(League league, LocalDate from, LocalDate to, LocalDate asOf) {
        List<LeagueMember> members = leagueService.getMembers(league.getId());
        Map<Long, User> users = userService.getAll(members.stream().map(LeagueMember::getUserId).toList());

        Map<Long, Integer> points = new HashMap<>();
        for (ScoreEvent e : scoreEvents.findByLeagueIdAndDateBetween(league.getId(), from, to)) {
            points.merge(e.getUserId(), e.getPoints(), Integer::sum);
        }

        // This week's progress (0-100) as of asOf, shown next to every period's points.
        LocalDate weekStart = TimeUtils.weekStart(asOf, rules.weekStartsOn());
        Map<Long, Integer> weeklyPercent = new HashMap<>();
        for (ScoreEvent e : scoreEvents.findByLeagueIdAndDateBetween(league.getId(), weekStart, weekStart.plusDays(6))) {
            if (e.getReason() == ScoreReason.WEEKLY_PROGRESS) { // challenge bonuses aren't goal progress
                weeklyPercent.merge(e.getUserId(), e.getPoints(), Integer::sum);
            }
        }

        Map<Long, Integer> minutes = new HashMap<>();
        Map<Long, Integer> tasks = new HashMap<>();
        Map<Long, Set<LocalDate>> activeDays = new HashMap<>();
        for (ProgressLog log : logs.findCompletedByLeagueId(league.getId())) {
            boolean challenge = log.getSource() == LogSource.CHALLENGE;
            // Skip empty timers in TIME leagues, but still count challenge completions as activities.
            if (!challenge && ScoringEngine.amountFor(league.getGoalType(), log.getDurationMinutes()) <= 0) {
                continue;
            }
            activeDays.computeIfAbsent(log.getUserId(), id -> new HashSet<>()).add(log.getLocalDate());
            if (!log.getLocalDate().isBefore(from) && !log.getLocalDate().isAfter(to)) {
                minutes.merge(log.getUserId(), log.getDurationMinutes(), Integer::sum);
                tasks.merge(log.getUserId(), 1, Integer::sum);
            }
        }
        boolean taskGoal = league.getGoalType() == GoalType.TASKS;

        record Row(LeagueMember member, User user, int points, int minutes, int tasks, int streak) {
            int progress(boolean taskGoal) {
                return taskGoal ? tasks : minutes;
            }
        }
        List<Row> rows = new ArrayList<>();
        for (LeagueMember m : members) {
            User u = users.get(m.getUserId());
            if (u == null) {
                continue;
            }
            int streak = StreakCalculator.currentStreak(activeDays.getOrDefault(m.getUserId(), Set.of()), asOf);
            rows.add(new Row(m, u, points.getOrDefault(m.getUserId(), 0), minutes.getOrDefault(m.getUserId(), 0),
                    tasks.getOrDefault(m.getUserId(), 0), streak));
        }
        rows.sort(Comparator.comparingInt(Row::points).reversed()
                .thenComparing(Comparator.comparingInt((Row r) -> r.progress(taskGoal)).reversed())
                .thenComparing(Comparator.comparingInt(Row::streak).reversed())
                .thenComparing(r -> r.member().getJoinedAt()));

        List<LeaderboardEntry> result = new ArrayList<>();
        for (int i = 0; i < rows.size(); i++) {
            Row r = rows.get(i);
            int percent = Math.min(weeklyPercent.getOrDefault(r.user().getId(), 0), rules.maxWeeklyPoints());
            result.add(new LeaderboardEntry(i + 1, r.user().getId(), r.user().getDisplayName(),
                    LeagueService.avatarFor(r.member(), r.user()), r.points(), percent, r.minutes(), r.tasks(),
                    r.streak(), standingFor(i, rows.size())));
        }
        return result;
    }

    /** 1st place = LEADER, last place = CHUD_ZONE (only with 2+ members). */
    private static Standing standingFor(int index, int size) {
        if (size < 2) {
            return Standing.NONE;
        }
        if (index == 0) {
            return Standing.LEADER;
        }
        return index == size - 1 ? Standing.CHUD_ZONE : Standing.NONE;
    }

    private LocalDate[] rangeFor(LeaderboardPeriod period, LocalDate today, League league) {
        return switch (period) {
            case DAILY -> new LocalDate[]{today, today};
            case WEEKLY -> {
                LocalDate start = TimeUtils.weekStart(today, rules.weekStartsOn());
                yield new LocalDate[]{start, start.plusDays(6)};
            }
            case MONTHLY -> {
                YearMonth month = YearMonth.from(today);
                yield new LocalDate[]{month.atDay(1), month.atEndOfMonth()};
            }
            case TOTAL -> new LocalDate[]{league.getStartDate(), league.getEndDate()};
        };
    }
}
