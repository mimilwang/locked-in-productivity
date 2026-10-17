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

    /** A TIME league with a 300-minute (5 hour) weekly goal. */
    private static List<Award> time(List<Long> members, LogEntry... logs) {
        return ScoringEngine.calculate(
                new Input(LEAGUE_START, LEAGUE_END, GoalType.TIME, 300, members, List.of(logs)), RULES);
    }

    /** A TASKS league with a 4-task weekly goal. */
    private static List<Award> tasks(List<Long> members, LogEntry... logs) {
        return ScoringEngine.calculate(
                new Input(LEAGUE_START, LEAGUE_END, GoalType.TASKS, 4, members, List.of(logs)), RULES);
    }

    private static int total(List<Award> awards, Long userId) {
        return awards.stream().filter(a -> a.userId().equals(userId)).mapToInt(Award::points).sum();
    }

    private static int onDay(List<Award> awards, Long userId, LocalDate day) {
        return awards.stream().filter(a -> a.userId().equals(userId) && a.date().equals(day)).mapToInt(Award::points).sum();
    }

    @Test
    void noLogsMeansNoPoints() {
        assertTrue(time(List.of(1L)).isEmpty());
    }

    @Test
    void halfTheGoalIsFiftyPoints() {
        assertEquals(50, total(time(List.of(1L), new LogEntry(1L, MON, 150)), 1L));
    }

    @Test
    void fullGoalIsOneHundredPoints() {
        assertEquals(100, total(time(List.of(1L), new LogEntry(1L, MON, 300)), 1L));
    }

    @Test
    void goingOverTheGoalIsStillCappedAtOneHundred() {
        List<Award> awards = time(List.of(1L), new LogEntry(1L, MON, 200), new LogEntry(1L, TUE, 200));
        assertEquals(100, total(awards, 1L));
    }

    @Test
    void percentIsRoundedDown() {
        // 221 / 300 = 73.67% -> 73 points
        assertEquals(73, total(time(List.of(1L), new LogEntry(1L, MON, 221)), 1L));
    }

    @Test
    void pointsUpdateEachDayWithTheGain() {
        // Mon 120 min = 40%, Wed +75 min = 65% -> Mon 40, Wed 25
        List<Award> awards = time(List.of(1L), new LogEntry(1L, MON, 120), new LogEntry(1L, WED, 75));
        assertEquals(40, onDay(awards, 1L, MON));
        assertEquals(25, onDay(awards, 1L, WED));
        assertEquals(65, total(awards, 1L));
    }

    @Test
    void dailyGainsAlwaysAddUpToTheRoundedWeeklyPercent() {
        // 1/3 of the goal three times: 33 + 33 + 34 = 100, never 99
        List<Award> awards = time(List.of(1L),
                new LogEntry(1L, MON, 100), new LogEntry(1L, TUE, 100), new LogEntry(1L, WED, 100));
        assertEquals(100, total(awards, 1L));
    }

    @Test
    void severalLogsOnOneDayAreAddedTogether() {
        List<Award> awards = time(List.of(1L), new LogEntry(1L, MON, 60), new LogEntry(1L, MON, 90));
        assertEquals(50, onDay(awards, 1L, MON));
    }

    @Test
    void noPointsOnceTheGoalIsAlreadyHit() {
        List<Award> awards = time(List.of(1L), new LogEntry(1L, MON, 300), new LogEntry(1L, TUE, 60));
        assertEquals(0, onDay(awards, 1L, TUE));
    }

    @Test
    void eachWeekStartsFromZero() {
        // Sunday and the next Monday are different weeks: each is 50% of its own week.
        List<Award> awards = time(List.of(1L), new LogEntry(1L, SUN, 150), new LogEntry(1L, NEXT_MON, 150));
        assertEquals(50, onDay(awards, 1L, SUN));
        assertEquals(50, onDay(awards, 1L, NEXT_MON));
    }

    @Test
    void canEarnUpToOneHundredEveryWeek() {
        List<Award> awards = time(List.of(1L), new LogEntry(1L, MON, 300), new LogEntry(1L, NEXT_MON, 300));
        assertEquals(200, total(awards, 1L));
    }

    @Test
    void everyoneIsScoredAgainstTheSameGoalSeparately() {
        List<Award> awards = time(List.of(1L, 2L), new LogEntry(1L, MON, 300), new LogEntry(2L, MON, 60));
        assertEquals(100, total(awards, 1L));
        assertEquals(20, total(awards, 2L));
    }

    @Test
    void taskGoalsCountEachLogAsOneTask() {
        // 4-task goal: 2 tasks = 50%, minutes don't matter
        List<Award> awards = tasks(List.of(1L), new LogEntry(1L, MON, 0), new LogEntry(1L, TUE, 45));
        assertEquals(50, total(awards, 1L));
    }

    @Test
    void taskGoalsAreCappedToo() {
        List<Award> awards = tasks(List.of(1L), new LogEntry(1L, MON, 0), new LogEntry(1L, MON, 0),
                new LogEntry(1L, TUE, 0), new LogEntry(1L, WED, 0), new LogEntry(1L, WED, 0));
        assertEquals(100, total(awards, 1L));
    }

    @Test
    void zeroMinuteLogsDontCountForTimeGoals() {
        assertTrue(time(List.of(1L), new LogEntry(1L, MON, 0)).isEmpty());
    }

    @Test
    void logsOutsideTheLeagueDontCount() {
        List<Award> awards = time(List.of(1L),
                new LogEntry(1L, LEAGUE_START.minusDays(1), 100), new LogEntry(1L, LEAGUE_END.plusDays(1), 100));
        assertTrue(awards.isEmpty());
    }

    @Test
    void logsFromNonMembersDontCount() {
        assertTrue(time(List.of(1L), new LogEntry(99L, MON, 100)).isEmpty());
    }

    @Test
    void weeklyPointsHelper() {
        assertEquals(0, ScoringEngine.weeklyPoints(0, 300, RULES));
        assertEquals(33, ScoringEngine.weeklyPoints(100, 300, RULES));
        assertEquals(100, ScoringEngine.weeklyPoints(900, 300, RULES));
    }
}
