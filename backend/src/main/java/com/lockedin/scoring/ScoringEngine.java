package com.lockedin.scoring;

import com.lockedin.common.TimeUtils;
import com.lockedin.league.GoalType;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
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
 * How points work (numbers come from ScoringRules / application.yml):
 *   MINUTES      floor(minutes that day / minutesPerPoint), max dailyPointCap per day
 *   STREAK       from day 2 of a streak: streak length x streakBonusPerDay, max streakBonusCap
 *   WEEKLY_GOAL  weeklyGoalBonus on the day your weekly total reaches the target (once per week)
 *   GROUP_BONUS  groupGoalBonus to everyone, once per week, when every member has hit the target
 */
public final class ScoringEngine {

    private ScoringEngine() {
    }

    /** One finished log, already turned into the user's local date. */
    public record LogEntry(Long userId, LocalDate date, int minutes) {
    }

    /** Everything the engine needs to know about a league. */
    public record Input(LocalDate startDate, LocalDate endDate, GoalType goalType, int weeklyTarget,
                        List<Long> memberIds, List<LogEntry> logs) {
    }

    /** One row of points. ScoringService saves these as ScoreEvents. */
    public record Award(Long userId, LocalDate date, int points, ScoreReason reason) {
    }

    private static final class DayTotal {
        int minutes;
        int sessions;
    }

    public static List<Award> calculate(Input input, ScoringRules rules) {
        Set<Long> members = new HashSet<>(input.memberIds());

        // 1. Add up each member's minutes and sessions per day (only days inside the league).
        Map<Long, TreeMap<LocalDate, DayTotal>> days = new HashMap<>();
        for (LogEntry log : input.logs()) {
            if (!members.contains(log.userId()) || log.minutes() <= 0) {
                continue;
            }
            if (log.date().isBefore(input.startDate()) || log.date().isAfter(input.endDate())) {
                continue;
            }
            DayTotal total = days.computeIfAbsent(log.userId(), id -> new TreeMap<>())
                    .computeIfAbsent(log.date(), d -> new DayTotal());
            total.minutes += log.minutes();
            total.sessions += 1;
        }

        List<Award> awards = new ArrayList<>();
        // weekStart -> (userId -> the day they hit the weekly target)
        Map<LocalDate, Map<Long, LocalDate>> weeklyHits = new TreeMap<>();

        for (Long userId : input.memberIds()) {
            TreeMap<LocalDate, DayTotal> userDays = days.getOrDefault(userId, new TreeMap<>());

            LocalDate previousDay = null;
            int streak = 0;
            Map<LocalDate, Integer> weekProgress = new HashMap<>();

            for (Map.Entry<LocalDate, DayTotal> entry : userDays.entrySet()) {
                LocalDate day = entry.getKey();
                DayTotal total = entry.getValue();

                // 2. Minute points, capped per day.
                int minutePoints = Math.min(total.minutes / rules.minutesPerPoint(), rules.dailyPointCap());
                if (minutePoints > 0) {
                    awards.add(new Award(userId, day, minutePoints, ScoreReason.MINUTES));
                }

                // 3. Streak bonus (from the 2nd day in a row).
                streak = (previousDay != null && previousDay.plusDays(1).equals(day)) ? streak + 1 : 1;
                previousDay = day;
                if (streak >= 2) {
                    int bonus = Math.min(streak * rules.streakBonusPerDay(), rules.streakBonusCap());
                    awards.add(new Award(userId, day, bonus, ScoreReason.STREAK));
                }

                // 4. Weekly goal: award it on the day the running weekly total first reaches the target.
                LocalDate weekStart = TimeUtils.weekStart(day, rules.weekStartsOn());
                int before = weekProgress.getOrDefault(weekStart, 0);
                int added = input.goalType() == GoalType.SESSIONS ? total.sessions : total.minutes;
                int after = before + added;
                weekProgress.put(weekStart, after);
                if (before < input.weeklyTarget() && after >= input.weeklyTarget()) {
                    awards.add(new Award(userId, day, rules.weeklyGoalBonus(), ScoreReason.WEEKLY_GOAL));
                    weeklyHits.computeIfAbsent(weekStart, w -> new HashMap<>()).put(userId, day);
                }
            }
        }

        // 5. Group bonus: if EVERY member hit the target that week, everyone gets it on the day the last one did.
        if (input.memberIds().size() >= 2) {
            for (Map<Long, LocalDate> hits : weeklyHits.values()) {
                if (hits.keySet().containsAll(members)) {
                    LocalDate lastHit = Collections.max(hits.values());
                    for (Long userId : input.memberIds()) {
                        awards.add(new Award(userId, lastHit, rules.groupGoalBonus(), ScoreReason.GROUP_BONUS));
                    }
                }
            }
        }

        awards.sort(Comparator.comparing(Award::date)
                .thenComparing(Award::userId)
                .thenComparing(Award::reason));
        return awards;
    }
}
