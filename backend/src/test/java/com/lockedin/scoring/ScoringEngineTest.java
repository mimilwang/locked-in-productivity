package com.lockedin.scoring;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.lockedin.league.GoalType;
import com.lockedin.scoring.ScoringEngine.Award;
import com.lockedin.scoring.ScoringEngine.Input;
import com.lockedin.scoring.ScoringEngine.LogEntry;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;

class ScoringEngineTest {

    // Oct 12 2026 is a Monday, Oct 18 a Sunday, Oct 19 the next Monday.
    private static final LocalDate MON = LocalDate.of(2026, 10, 12);
    private static final LocalDate TUE = MON.plusDays(1);
    private static final LocalDate WED = MON.plusDays(2);
    private static final LocalDate SUN = MON.plusDays(6);
    private static final LocalDate NEXT_MON = MON.plusDays(7);
    private static final LocalDate LEAGUE_START = MON;
    private static final LocalDate LEAGUE_END = MON.plusWeeks(4).minusDays(1);

    private static final ScoringRules RULES = ScoringRules.defaults();

    private static List<Award> score(int weeklyTarget, List<Long> members, LogEntry... logs) {
        return ScoringEngine.calculate(
                new Input(LEAGUE_START, LEAGUE_END, GoalType.MINUTES, weeklyTarget, members, List.of(logs)), RULES);
    }

    private static int total(List<Award> awards, Long userId, ScoreReason reason) {
        return awards.stream().filter(a -> a.userId().equals(userId) && a.reason() == reason).mapToInt(Award::points).sum();
    }

    private static int total(List<Award> awards, Long userId) {
        return awards.stream().filter(a -> a.userId().equals(userId)).mapToInt(Award::points).sum();
    }

    @Test
    void noLogsMeansNoPoints() {
        assertTrue(score(300, List.of(1L)).isEmpty());
    }

    @Test
    void zeroMinuteLogsAreIgnored() {
        assertTrue(score(300, List.of(1L), new LogEntry(1L, MON, 0)).isEmpty());
    }

    @Test
    void onePointPerTenMinutesRoundedDown() {
        List<Award> awards = score(1000, List.of(1L), new LogEntry(1L, MON, 25));
        assertEquals(2, total(awards, 1L, ScoreReason.MINUTES));
    }

    @Test
    void logsOnTheSameDayAreAddedBeforeRounding() {
        // 5 + 5 minutes = 10 minutes = 1 point (not 0 + 0)
        List<Award> awards = score(1000, List.of(1L), new LogEntry(1L, MON, 5), new LogEntry(1L, MON, 5));
        assertEquals(1, total(awards, 1L, ScoreReason.MINUTES));
    }

    @Test
    void minutePointsAreCappedPerDay() {
        // 400 minutes = 40 points, but the daily cap is 30
        List<Award> awards = score(10000, List.of(1L), new LogEntry(1L, MON, 200), new LogEntry(1L, MON, 200));
        assertEquals(RULES.dailyPointCap(), total(awards, 1L, ScoreReason.MINUTES));
    }

    @Test
    void weeklyGoalHitExactly() {
        List<Award> awards = score(60, List.of(1L), new LogEntry(1L, MON, 30), new LogEntry(1L, WED, 30));
        assertEquals(RULES.weeklyGoalBonus(), total(awards, 1L, ScoreReason.WEEKLY_GOAL));
        Award bonus = awards.stream().filter(a -> a.reason() == ScoreReason.WEEKLY_GOAL).findFirst().orElseThrow();
        assertEquals(WED, bonus.date()); // awarded the day the target was reached
    }

    @Test
    void weeklyGoalOneMinuteShortGetsNothing() {
        List<Award> awards = score(60, List.of(1L), new LogEntry(1L, MON, 30), new LogEntry(1L, WED, 29));
        assertEquals(0, total(awards, 1L, ScoreReason.WEEKLY_GOAL));
    }

    @Test
    void weeklyGoalOnlyAwardedOncePerWeek() {
        List<Award> awards = score(30, List.of(1L), new LogEntry(1L, MON, 30), new LogEntry(1L, TUE, 30));
        assertEquals(RULES.weeklyGoalBonus(), total(awards, 1L, ScoreReason.WEEKLY_GOAL));
    }

    @Test
    void weeksResetOnMonday() {
        // Sunday + next Monday are in different weeks, so 30 + 30 doesn't reach 60.
        List<Award> awards = score(60, List.of(1L), new LogEntry(1L, SUN, 30), new LogEntry(1L, NEXT_MON, 30));
        assertEquals(0, total(awards, 1L, ScoreReason.WEEKLY_GOAL));
    }

    @Test
    void streakBonusStartsOnDayTwoAndGrows() {
        List<Award> awards = score(10000, List.of(1L),
                new LogEntry(1L, MON, 10), new LogEntry(1L, TUE, 10), new LogEntry(1L, WED, 10));
        // day 1: none, day 2: 2x2 = 4, day 3: 3x2 = 6
        assertEquals(10, total(awards, 1L, ScoreReason.STREAK));
    }

    @Test
    void streakBonusIsCapped() {
        LogEntry[] week = new LogEntry[7];
        for (int i = 0; i < 7; i++) {
            week[i] = new LogEntry(1L, MON.plusDays(i), 10);
        }
        List<Award> awards = score(10000, List.of(1L), week);
        // days 2..7: 4, 6, 8, 10, 10, 10
        assertEquals(48, total(awards, 1L, ScoreReason.STREAK));
    }

    @Test
    void missedDayResetsStreak() {
        List<Award> awards = score(10000, List.of(1L), new LogEntry(1L, MON, 10), new LogEntry(1L, WED, 10));
        assertEquals(0, total(awards, 1L, ScoreReason.STREAK));
    }

    @Test
    void groupBonusWhenEveryoneHitsTheGoal() {
        List<Award> awards = score(30, List.of(1L, 2L), new LogEntry(1L, MON, 30), new LogEntry(2L, WED, 30));
        assertEquals(RULES.groupGoalBonus(), total(awards, 1L, ScoreReason.GROUP_BONUS));
        assertEquals(RULES.groupGoalBonus(), total(awards, 2L, ScoreReason.GROUP_BONUS));
        Award bonus = awards.stream().filter(a -> a.reason() == ScoreReason.GROUP_BONUS).findFirst().orElseThrow();
        assertEquals(WED, bonus.date()); // the day the last person hit it
    }

    @Test
    void noGroupBonusIfSomeoneMisses() {
        List<Award> awards = score(30, List.of(1L, 2L), new LogEntry(1L, MON, 30), new LogEntry(2L, WED, 10));
        assertEquals(0, total(awards, 1L, ScoreReason.GROUP_BONUS));
    }

    @Test
    void groupBonusOnlyOncePerWeek() {
        List<Award> awards = score(30, List.of(1L, 2L),
                new LogEntry(1L, MON, 30), new LogEntry(2L, MON, 30),
                new LogEntry(1L, TUE, 30), new LogEntry(2L, TUE, 30));
        assertEquals(RULES.groupGoalBonus(), total(awards, 1L, ScoreReason.GROUP_BONUS));
    }

    @Test
    void logsOutsideTheLeagueDontCount() {
        List<Award> awards = score(10000, List.of(1L),
                new LogEntry(1L, LEAGUE_START.minusDays(1), 100), new LogEntry(1L, LEAGUE_END.plusDays(1), 100));
        assertTrue(awards.isEmpty());
    }

    @Test
    void logsFromNonMembersDontCount() {
        List<Award> awards = score(10000, List.of(1L), new LogEntry(99L, MON, 100));
        assertTrue(awards.isEmpty());
    }

    @Test
    void sessionGoalsCountLogsNotMinutes() {
        Input input = new Input(LEAGUE_START, LEAGUE_END, GoalType.SESSIONS, 3, List.of(1L), List.of(
                new LogEntry(1L, MON, 10), new LogEntry(1L, MON, 10), new LogEntry(1L, WED, 10)));
        List<Award> awards = ScoringEngine.calculate(input, RULES);
        assertEquals(RULES.weeklyGoalBonus(), total(awards, 1L, ScoreReason.WEEKLY_GOAL));
    }

    @Test
    void fullWeekExample() {
        // 60 min Mon, 60 min Tue, target 120:
        // minutes 6 + 6, streak 4 on Tue, weekly goal 20 on Tue = 36
        List<Award> awards = score(120, List.of(1L), new LogEntry(1L, MON, 60), new LogEntry(1L, TUE, 60));
        assertEquals(36, total(awards, 1L));
    }
}
