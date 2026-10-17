package com.lockedin.scoring;

import java.time.LocalDate;
import java.util.Collection;
import java.util.Set;
import java.util.TreeSet;

/** A streak = consecutive calendar days with at least one log. Pure math, no database. */
public final class StreakCalculator {

    private StreakCalculator() {
    }

    /**
     * Your streak right now. Today not logged yet doesn't break it:
     * if you logged yesterday, the streak is still alive until today ends.
     */
    public static int currentStreak(Set<LocalDate> activeDays, LocalDate today) {
        LocalDate day;
        if (activeDays.contains(today)) {
            day = today;
        } else if (activeDays.contains(today.minusDays(1))) {
            day = today.minusDays(1);
        } else {
            return 0;
        }
        return streakEndingOn(activeDays, day);
    }

    /** How many days in a row end on this date (0 if nothing was logged that day). */
    public static int streakEndingOn(Set<LocalDate> activeDays, LocalDate day) {
        int streak = 0;
        while (activeDays.contains(day)) {
            streak++;
            day = day.minusDays(1);
        }
        return streak;
    }

    /** The longest streak ever. */
    public static int bestStreak(Collection<LocalDate> activeDays) {
        int best = 0;
        int run = 0;
        LocalDate previous = null;
        for (LocalDate day : new TreeSet<>(activeDays)) {
            run = (previous != null && previous.plusDays(1).equals(day)) ? run + 1 : 1;
            best = Math.max(best, run);
            previous = day;
        }
        return best;
    }
}
