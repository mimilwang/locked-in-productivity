package com.lockedin.scoring;

import com.lockedin.common.TimeUtils;
import com.lockedin.league.GoalType;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

/**
 * Turns progress logs into points. This is a PURE function: same input, same output, no database.
 * That's what makes it easy to unit test (see ScoringEngineTest).
 *
 * How points work:
 *   - The league has ONE weekly goal (e.g. 300 minutes, or 4 tasks). Every member has to hit it on their own.
 *   - Your weekly score = the % of the goal you've done, rounded down. 50% = 50 points, 100% = 100 points.
 *   - It's capped at 100 per week (maxWeeklyPoints). Doing more than the goal doesn't add points.
 *   - Points are saved on the day you earned them. Going from 40% to 65% on Wednesday = 25 points on Wednesday.
 *     That's what the daily leaderboard shows, and monthly totals add up correctly even when a week
 *     spans two months.
 *   - TIME goals count minutes. TASKS goals count every log as 1 task.
 *   - Daily challenges add their bonus points ON TOP (CHALLENGE_BONUS), outside the 100/week cap.
 */
public final class ScoringEngine {

    private ScoringEngine() {
    }

    /** One finished log, already turned into the user's local date. bonusPoints > 0 for daily challenges. */
    public record LogEntry(Long userId, LocalDate date, int minutes, int bonusPoints) {

        public LogEntry(Long userId, LocalDate date, int minutes) {
            this(userId, date, minutes, 0);
        }
    }

    /** Everything the engine needs to know about a league. */
    public record Input(LocalDate startDate, LocalDate endDate, GoalType goalType, int weeklyTarget,
                        List<Long> memberIds, List<LogEntry> logs) {
    }

    /** One row of points. ScoringService saves these as ScoreEvents. */
    public record Award(Long userId, LocalDate date, int points, ScoreReason reason) {
    }

    public static List<Award> calculate(Input input, ScoringRules rules) {
        Set<Long> members = new HashSet<>(input.memberIds());

        // 1. How much progress each member made each day (minutes, or number of tasks).
        Map<Long, TreeMap<LocalDate, Integer>> progressByDay = new HashMap<>();
        for (LogEntry log : input.logs()) {
            if (!members.contains(log.userId())) {
                continue;
            }
            if (log.date().isBefore(input.startDate()) || log.date().isAfter(input.endDate())) {
                continue;
            }
            int amount = amountFor(input.goalType(), log.minutes());
            if (amount <= 0) {
                continue;
            }
            progressByDay.computeIfAbsent(log.userId(), id -> new TreeMap<>()).merge(log.date(), amount, Integer::sum);
        }

        // 2. Walk through each member's days in order, keeping a running total per week.
        //    Each day earns the jump in their weekly %.
        List<Award> awards = new ArrayList<>();
        for (Long userId : input.memberIds()) {
            Map<LocalDate, Integer> weeklyTotal = new HashMap<>();
            for (Map.Entry<LocalDate, Integer> day : progressByDay.getOrDefault(userId, new TreeMap<>()).entrySet()) {
                LocalDate weekStart = TimeUtils.weekStart(day.getKey(), rules.weekStartsOn());
                int before = weeklyTotal.getOrDefault(weekStart, 0);
                int after = before + day.getValue();
                weeklyTotal.put(weekStart, after);

                int gained = weeklyPoints(after, input.weeklyTarget(), rules) - weeklyPoints(before, input.weeklyTarget(), rules);
                if (gained > 0) {
                    awards.add(new Award(userId, day.getKey(), gained, ScoreReason.WEEKLY_PROGRESS));
                }
            }
        }

        // 3. Daily challenge bonuses, on top of the weekly score.
        for (LogEntry log : input.logs()) {
            if (log.bonusPoints() <= 0 || !members.contains(log.userId())) {
                continue;
            }
            if (log.date().isBefore(input.startDate()) || log.date().isAfter(input.endDate())) {
                continue;
            }
            awards.add(new Award(log.userId(), log.date(), log.bonusPoints(), ScoreReason.CHALLENGE_BONUS));
        }

        awards.sort(Comparator.comparing(Award::date).thenComparing(Award::userId).thenComparing(Award::reason));
        return awards;
    }

    /** Points for having done `progress` out of `target` this week: % of the goal, rounded down, max 100. */
    public static int weeklyPoints(int progress, int target, ScoringRules rules) {
        if (target <= 0 || progress <= 0) {
            return 0;
        }
        long capped = Math.min(progress, target);
        return (int) (capped * rules.maxWeeklyPoints() / target);
    }

    /** What one log adds toward the goal: its minutes for TIME goals, 1 for TASKS goals. */
    public static int amountFor(GoalType goalType, int minutes) {
        return goalType == GoalType.TASKS ? 1 : Math.max(minutes, 0);
    }
}
