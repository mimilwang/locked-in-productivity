package com.lockedin.scoring;

/** Why someone got points. Add a new value here if you add a new way to earn points. */
public enum ScoreReason {
    /** Progress toward this week's goal: 1 point per 1% of the goal, up to 100 per week. */
    WEEKLY_PROGRESS,
    /** A completed daily challenge's bonus. Added on top: not limited by the 100/week cap. */
    CHALLENGE_BONUS
}
