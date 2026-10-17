package com.lockedin.scoring;

/** Why someone got points. Add a new value here when you add a new way to earn points. */
public enum ScoreReason {
    /** 1 point per minutesPerPoint minutes logged that day (capped). */
    MINUTES,
    /** Bonus on the day you hit your weekly target. */
    WEEKLY_GOAL,
    /** Bonus for each day of a streak (from day 2). */
    STREAK,
    /** Bonus for everyone when every member hits the weekly target. */
    GROUP_BONUS
}
