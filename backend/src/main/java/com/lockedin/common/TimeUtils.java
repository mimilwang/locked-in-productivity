package com.lockedin.common;

import java.time.Clock;
import java.time.DateTimeException;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.temporal.TemporalAdjusters;

/**
 * Time zone helpers. Rule of thumb: store Instants (UTC) in the database,
 * and convert to a user's LocalDate only when deciding "which day did this happen on".
 */
public final class TimeUtils {

    private TimeUtils() {
    }

    public static boolean isValidZone(String zoneId) {
        if (zoneId == null || zoneId.isBlank()) {
            return false;
        }
        try {
            ZoneId.of(zoneId);
            return true;
        } catch (DateTimeException e) {
            return false;
        }
    }

    /** Falls back to UTC if the zone is missing or invalid. */
    public static ZoneId zone(String zoneId) {
        return isValidZone(zoneId) ? ZoneId.of(zoneId) : ZoneOffset.UTC;
    }

    /** Which calendar day an instant falls on for someone in this time zone. */
    public static LocalDate localDate(Instant instant, ZoneId zone) {
        return instant.atZone(zone).toLocalDate();
    }

    public static LocalDate today(Clock clock, ZoneId zone) {
        return LocalDate.now(clock.withZone(zone));
    }

    /** The first day of the week that contains this date, e.g. the Monday before. */
    public static LocalDate weekStart(LocalDate date, DayOfWeek firstDayOfWeek) {
        return date.with(TemporalAdjusters.previousOrSame(firstDayOfWeek));
    }
}
