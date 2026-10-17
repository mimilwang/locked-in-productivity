package com.lockedin.scoring;

import java.time.DayOfWeek;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Every scoring number, loaded from the "scoring:" section of application.yml.
 * To change how points work, change the yml, not the code.
 *
 * maxWeeklyPoints: points for hitting 100% of the weekly goal (50% = half of this).
 * maxLogMinutes:   longest single log / timer that counts.
 * weekStartsOn:    the day each week (and weekly score) resets.
 */
@ConfigurationProperties(prefix = "scoring")
public record ScoringRules(int maxWeeklyPoints, int maxLogMinutes, DayOfWeek weekStartsOn) {

    /** Same values as application.yml. Handy for tests. */
    public static ScoringRules defaults() {
        return new ScoringRules(100, 240, DayOfWeek.MONDAY);
    }
}
