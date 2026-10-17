package com.lockedin.league.dto;

import com.lockedin.league.GoalType;
import com.lockedin.league.League;
import com.lockedin.league.MemberRole;
import java.time.LocalDate;

/**
 * readyToStart is true once the league has the minimum 4 members.
 * myRole is null if you aren't a member (e.g. previewing an invite).
 */
public record LeagueResponse(
        Long id,
        String name,
        String goalDescription,
        GoalType goalType,
        int weeklyTarget,
        LocalDate startDate,
        LocalDate endDate,
        String inviteCode,
        String photoUrl,
        String reward,
        String punishment,
        Long creatorId,
        int memberCount,
        boolean readyToStart,
        MemberRole myRole) {

    public static LeagueResponse of(League l, int memberCount, int minMembers, MemberRole myRole) {
        return new LeagueResponse(
                l.getId(), l.getName(), l.getGoalDescription(), l.getGoalType(), l.getWeeklyTarget(),
                l.getStartDate(), l.getEndDate(), l.getInviteCode(), l.getPhotoUrl(), l.getReward(),
                l.getPunishment(), l.getCreatorId(), memberCount,
                memberCount >= minMembers, myRole);
    }
}
