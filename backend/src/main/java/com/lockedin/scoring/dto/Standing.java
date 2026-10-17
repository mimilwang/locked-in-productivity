package com.lockedin.scoring.dto;

/**
 * Where a member sits on a leaderboard, so the frontend can highlight it.
 * LEADER = 1st place (on the monthly board: the MVP if the month ended now).
 * CHUD_ZONE = last place (on the monthly board: the Chud if the month ended now).
 * Only set when the league has at least 2 members.
 */
public enum Standing {
    LEADER,
    CHUD_ZONE,
    NONE
}
