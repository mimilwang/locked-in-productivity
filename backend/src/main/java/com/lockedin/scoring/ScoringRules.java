package com.lockedin.scoring;

import java.time.DayOfWeek;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Every scoring number, loaded from the "scoring:" section of application.yml.
 * To change how points work, change the yml, not the code.
 */
@ConfigurationProperties(prefix = "scoring")
public record ScoringRules(
        int minutesPerPoint,
        int dailyPointCap,
        int weeklyGoalBonus,
        int streakBonusPerDay,
        int streakBonusCap,
        int groupGoalBonus,
        int maxLogMinutes,
        DayOfWeek weekStartsOn) {

    /** Same values as application.yml. Handy for tests. */
    public static ScoringRules defaults() {
        return new ScoringRules(10, 30, 20, 2, 10, 5, 240, DayOfWeek.MONDAY);
    }
}
