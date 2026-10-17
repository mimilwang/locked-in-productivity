package com.lockedin.scoring;

/** Why someone got points. Add a new value here if you add a new way to earn points. */
public enum ScoreReason {
    /** Progress toward this week's goal: 1 point per 1% of the goal, up to 100 per week. */
    WEEKLY_PROGRESS
}
