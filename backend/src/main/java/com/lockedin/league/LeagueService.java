package com.lockedin.league;

import com.lockedin.account.User;
import com.lockedin.account.UserService;
import com.lockedin.common.ApiException;
import com.lockedin.common.TimeUtils;
import com.lockedin.league.dto.CreateLeagueRequest;
import com.lockedin.league.dto.JoinLeagueRequest;
import com.lockedin.league.dto.LeagueResponse;
import com.lockedin.league.dto.MemberResponse;
import com.lockedin.scoring.ScoringService;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LeagueService {

    public static final int MIN_MEMBERS = 4;
    public static final int MAX_MEMBERS = 15;
    private static final int DEFAULT_DURATION_WEEKS = 4;

    private final LeagueRepository leagues;
    private final LeagueMemberRepository members;
    private final InviteCodeGenerator inviteCodes;
    private final UserService userService;
    private final ScoringService scoringService;
    private final Clock clock;

    public LeagueService(LeagueRepository leagues, LeagueMemberRepository members, InviteCodeGenerator inviteCodes,
                         UserService userService, ScoringService scoringService, Clock clock) {
        this.leagues = leagues;
        this.members = members;
        this.inviteCodes = inviteCodes;
        this.userService = userService;
        this.scoringService = scoringService;
        this.clock = clock;
    }

    @Transactional
    public LeagueResponse create(Long me, CreateLeagueRequest request) {
        User creator = userService.get(me);
        LocalDate today = TimeUtils.today(clock, TimeUtils.zone(creator.getTimeZone()));
        LocalDate start = request.startDate() != null ? request.startDate() : today;
        if (start.isBefore(today)) {
            throw ApiException.badRequest("Start date can't be in the past");
        }
        int weeks = request.durationWeeks() != null ? request.durationWeeks() : DEFAULT_DURATION_WEEKS;
        LocalDate end = start.plusWeeks(weeks).minusDays(1);

        Instant now = clock.instant();
        League league = leagues.save(new League(
                request.name().trim(),
                request.goalDescription().trim(),
                request.goalType(),
                request.weeklyTarget(),
                start,
                end,
                newInviteCode(),
                request.photoUrl(),
                request.reward().trim(),
                request.punishment().trim(),
                me,
                now));

        // Creating a league = agreeing to its rules.
        members.save(new LeagueMember(league.getId(), me, request.avatarUrl(), MemberRole.OWNER, now, now));
        return toResponse(league, MemberRole.OWNER);
    }

    @Transactional
    public LeagueResponse join(Long me, JoinLeagueRequest request) {
        User user = userService.get(me);
        League league = leagues.findByInviteCode(request.inviteCode().trim().toUpperCase())
                .orElseThrow(() -> ApiException.notFound("No league with that invite code"));

        if (!Boolean.TRUE.equals(request.agreedToRules())) {
            throw ApiException.badRequest("You need to agree to the league rules to join");
        }
        if (members.existsByLeagueIdAndUserId(league.getId(), me)) {
            throw ApiException.conflict("You're already in this league");
        }
        if (members.countByLeagueId(league.getId()) >= MAX_MEMBERS) {
            throw ApiException.conflict("This league is full (" + MAX_MEMBERS + " members max)");
        }
        LocalDate today = TimeUtils.today(clock, TimeUtils.zone(user.getTimeZone()));
        if (today.isAfter(league.getEndDate())) {
            throw ApiException.badRequest("This league has already ended");
        }

        Instant now = clock.instant();
        members.save(new LeagueMember(league.getId(), me, request.avatarUrl(), MemberRole.MEMBER, now, now));
        // A new member changes whether "the whole league" hit the group goal.
        scoringService.recalculateLeague(league.getId());
        return toResponse(league, MemberRole.MEMBER);
    }

    public LeagueResponse get(Long me, Long leagueId) {
        League league = getLeague(leagueId);
        LeagueMember membership = requireMember(leagueId, me);
        return toResponse(league, membership.getRole());
    }

    /** For the join page: anyone logged in with the code can see the league before joining. */
    public LeagueResponse preview(Long me, String inviteCode) {
        League league = leagues.findByInviteCode(inviteCode.trim().toUpperCase())
                .orElseThrow(() -> ApiException.notFound("No league with that invite code"));
        MemberRole role = members.findByLeagueIdAndUserId(league.getId(), me).map(LeagueMember::getRole).orElse(null);
        return toResponse(league, role);
    }

    public List<LeagueResponse> myLeagues(Long me) {
        return members.findByUserId(me).stream()
                .map(m -> toResponse(getLeague(m.getLeagueId()), m.getRole()))
                .toList();
    }

    public List<MemberResponse> members(Long me, Long leagueId) {
        requireMember(leagueId, me);
        List<LeagueMember> list = getMembers(leagueId);
        Map<Long, User> users = userService.getAll(list.stream().map(LeagueMember::getUserId).toList());
        return list.stream()
                .filter(m -> users.containsKey(m.getUserId()))
                .map(m -> {
                    User u = users.get(m.getUserId());
                    return new MemberResponse(u.getId(), u.getDisplayName(), avatarFor(m, u), m.getRole(), m.getJoinedAt());
                })
                .toList();
    }

    // ---------- helpers other packages use ----------

    public League getLeague(Long leagueId) {
        return leagues.findById(leagueId).orElseThrow(() -> ApiException.notFound("League not found"));
    }

    public LeagueMember requireMember(Long leagueId, Long userId) {
        getLeague(leagueId);
        return members.findByLeagueIdAndUserId(leagueId, userId)
                .orElseThrow(() -> ApiException.forbidden("You're not a member of this league"));
    }

    public void requireOwner(Long leagueId, Long userId) {
        if (requireMember(leagueId, userId).getRole() != MemberRole.OWNER) {
            throw ApiException.forbidden("Only the league owner can do this");
        }
    }

    public List<LeagueMember> getMembers(Long leagueId) {
        return members.findByLeagueIdOrderByJoinedAtAsc(leagueId);
    }

    /** League avatar if they picked one, otherwise their profile photo. */
    public static String avatarFor(LeagueMember member, User user) {
        return member.getAvatarUrl() != null ? member.getAvatarUrl() : user.getProfilePhotoUrl();
    }

    private LeagueResponse toResponse(League league, MemberRole myRole) {
        int count = (int) members.countByLeagueId(league.getId());
        return LeagueResponse.of(league, count, MIN_MEMBERS, myRole);
    }

    private String newInviteCode() {
        for (int attempt = 0; attempt < 20; attempt++) {
            String code = inviteCodes.generate();
            if (!leagues.existsByInviteCode(code)) {
                return code;
            }
        }
        throw new IllegalStateException("Could not generate a unique invite code");
    }

}
