package com.lockedin.scoring.dto;

import com.lockedin.league.GoalType;
import java.time.LocalDate;
import java.util.List;

/**
 * Everything for the league overview page in one call.
 * todaysLeader is null if nobody has points today.
 * groupGoalProgress is 0.0-1.0 (share of members who hit the weekly target).
 * myWeeklyProgress is your minutes (TIME) or tasks (TASKS) this week. Your weekly points are in weeklyLeaderboard.
 */
public record LeagueOverview(
        Long leagueId,
        String leagueName,
        String goalDescription,
        GoalType goalType,
        int weeklyTarget,
        LocalDate weekStart,
        LocalDate weekEnd,
        LeaderboardEntry todaysLeader,
        List<LeaderboardEntry> weeklyLeaderboard,
        int totalMinutesThisWeek,
        int membersHitWeeklyGoal,
        int memberCount,
        double groupGoalProgress,
        int myWeeklyProgress,
        long daysLeft) {
}
