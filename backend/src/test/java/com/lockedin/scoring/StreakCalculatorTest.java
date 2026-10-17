package com.lockedin.scoring;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.lockedin.common.TimeUtils;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;

class StreakCalculatorTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 10, 17);

    @Test
    void streakContinuesThroughToday() {
        Set<LocalDate> days = Set.of(TODAY, TODAY.minusDays(1), TODAY.minusDays(2));
        assertEquals(3, StreakCalculator.currentStreak(days, TODAY));
    }

    @Test
    void notLoggingYetTodayDoesNotBreakStreak() {
        Set<LocalDate> days = Set.of(TODAY.minusDays(1), TODAY.minusDays(2));
        assertEquals(2, StreakCalculator.currentStreak(days, TODAY));
    }

    @Test
    void streakBreaksAfterAMissedDay() {
        Set<LocalDate> days = Set.of(TODAY.minusDays(2), TODAY.minusDays(3));
        assertEquals(0, StreakCalculator.currentStreak(days, TODAY));
    }

    @Test
    void noLogsMeansNoStreak() {
        assertEquals(0, StreakCalculator.currentStreak(Set.of(), TODAY));
        assertEquals(0, StreakCalculator.bestStreak(Set.of()));
    }

    @Test
    void bestStreakFindsTheLongestRun() {
        List<LocalDate> days = List.of(
                TODAY.minusDays(10), TODAY.minusDays(9), TODAY.minusDays(8), TODAY.minusDays(7), // 4 in a row
                TODAY.minusDays(3), TODAY.minusDays(2)); // 2 in a row
        assertEquals(4, StreakCalculator.bestStreak(days));
    }

    @Test
    void lateNightLogCountsForTheUsersOwnDay() {
        // 11:30pm Oct 16 in Los Angeles is already 6:30am Oct 17 in UTC.
        Instant lateNight = Instant.parse("2026-10-17T06:30:00Z");
        assertEquals(LocalDate.of(2026, 10, 16), TimeUtils.localDate(lateNight, ZoneId.of("America/Los_Angeles")));
        assertEquals(LocalDate.of(2026, 10, 17), TimeUtils.localDate(lateNight, ZoneId.of("UTC")));
    }

    @Test
    void sameInstantDifferentStreaksInDifferentTimeZones() {
        // A user logs at 11:30pm LA time on Oct 15 and Oct 16 (UTC: early morning Oct 16 and Oct 17).
        ZoneId la = ZoneId.of("America/Los_Angeles");
        Set<LocalDate> laDays = Set.of(
                TimeUtils.localDate(Instant.parse("2026-10-16T06:30:00Z"), la),
                TimeUtils.localDate(Instant.parse("2026-10-17T06:30:00Z"), la));
        // In LA it's Oct 17 and they haven't logged today yet: streak of 2 still alive.
        assertEquals(2, StreakCalculator.currentStreak(laDays, LocalDate.of(2026, 10, 17)));
    }

    @Test
    void weekStartsOnMonday() {
        assertEquals(LocalDate.of(2026, 10, 12), TimeUtils.weekStart(TODAY, java.time.DayOfWeek.MONDAY));
        assertEquals(LocalDate.of(2026, 10, 12), TimeUtils.weekStart(LocalDate.of(2026, 10, 12), java.time.DayOfWeek.MONDAY));
    }
}
