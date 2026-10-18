package com.lockedin.progress;

import com.lockedin.account.UserService;
import com.lockedin.common.ApiException;
import com.lockedin.common.TimeUtils;
import com.lockedin.league.GoalType;
import com.lockedin.league.League;
import com.lockedin.league.LeagueService;
import com.lockedin.progress.dto.CompleteChallengeRequest;
import com.lockedin.progress.dto.LogResponse;
import com.lockedin.progress.dto.ManualLogRequest;
import com.lockedin.progress.dto.StartTimerRequest;
import com.lockedin.scoring.ScoringRules;
import com.lockedin.scoring.ScoringService;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProgressService {

    private final ProgressLogRepository logs;
    private final LeagueService leagueService;
    private final UserService userService;
    private final ScoringService scoringService;
    private final ScoringRules rules;
    private final Clock clock;

    public ProgressService(ProgressLogRepository logs, LeagueService leagueService, UserService userService,
                           ScoringService scoringService, ScoringRules rules, Clock clock) {
        this.logs = logs;
        this.leagueService = leagueService;
        this.userService = userService;
        this.scoringService = scoringService;
        this.rules = rules;
        this.clock = clock;
    }

    @Transactional
    public LogResponse startTimer(Long me, StartTimerRequest request) {
        leagueService.requireMember(request.leagueId(), me);
        League league = leagueService.getLeague(request.leagueId());
        if (logs.findFirstByUserIdAndEndedAtIsNull(me).isPresent()) {
            throw ApiException.conflict("You already have a timer running. Stop it first.");
        }

        Instant now = clock.instant();
        LocalDate day = TimeUtils.localDate(now, userService.zoneOf(me));
        requireLeagueActive(league, day);

        ProgressLog log = logs.save(new ProgressLog(me, league.getId(), now, null, 0, LogSource.TIMER, day, request.note()));
        return LogResponse.from(log);
    }

    @Transactional
    public LogResponse stopTimer(Long me, Long logId) {
        ProgressLog log = getOwnLog(me, logId);
        if (!log.isRunning()) {
            throw ApiException.badRequest("This timer isn't running");
        }
        Instant now = clock.instant();
        long minutes = Duration.between(log.getStartedAt(), now).toMinutes();
        // Forgot to stop it overnight? It only counts up to the max.
        int capped = (int) Math.min(minutes, rules.maxLogMinutes());
        log.stop(now, capped);

        scoringService.recalculateLeague(log.getLeagueId());
        return LogResponse.from(log);
    }

    @Transactional
    public LogResponse logManually(Long me, ManualLogRequest request) {
        leagueService.requireMember(request.leagueId(), me);
        League league = leagueService.getLeague(request.leagueId());
        ZoneId zone = userService.zoneOf(me);
        LocalDate today = TimeUtils.today(clock, zone);
        LocalDate day = request.date() != null ? request.date() : today;

        if (day.isAfter(today)) {
            throw ApiException.badRequest("You can't log progress in the future");
        }
        int minutes = request.minutes() == null ? 0 : request.minutes();
        if (league.getGoalType() == GoalType.TIME && minutes < 1) {
            throw ApiException.badRequest("Enter how many minutes you did");
        }
        if (minutes > rules.maxLogMinutes()) {
            throw ApiException.badRequest("A single log can't be longer than " + rules.maxLogMinutes() + " minutes");
        }
        requireLeagueActive(league, day);

        Instant now = clock.instant();
        String title = request.title() == null || request.title().isBlank() ? null : request.title().trim();
        String note = request.note() == null || request.note().isBlank() ? null : request.note().trim();
        List<String> photos = request.photoUrls() == null ? List.of()
                : request.photoUrls().stream().filter(url -> url != null && !url.isBlank()).toList();
        ProgressLog log = logs.save(new ProgressLog(me, league.getId(), now, now, minutes,
                LogSource.MANUAL, day, title, note, photos));
        scoringService.recalculateLeague(league.getId());
        return LogResponse.from(log);
    }

    /**
     * Daily challenge done: saved as an activity with bonus points (on top of the weekly cap).
     * In TASKS leagues it also counts as 1 task. Once per challenge per day.
     * If buddyUserId is set, that league member also gets the same bonus (unless they already completed it today).
     */
    @Transactional
    public LogResponse completeChallenge(Long me, Long leagueId, CompleteChallengeRequest request) {
        leagueService.requireMember(leagueId, me);
        League league = leagueService.getLeague(leagueId);
        LocalDate today = TimeUtils.today(clock, userService.zoneOf(me));
        requireLeagueActive(league, today);
        String challengeId = request.challengeId().trim();
        if (logs.findFirstByUserIdAndLeagueIdAndChallengeIdAndLocalDate(me, leagueId, challengeId, today).isPresent()) {
            throw ApiException.conflict("You already completed this challenge today");
        }

        Long buddyUserId = request.buddyUserId();
        String note = request.note() == null || request.note().isBlank() ? null : request.note().trim();
        Instant now = clock.instant();
        String title = request.title().trim();
        int points = request.points();

        if (buddyUserId != null) {
            if (buddyUserId.equals(me)) {
                throw ApiException.badRequest("Pick a different league member as your buddy");
            }
            leagueService.requireMember(leagueId, buddyUserId);
            String buddyName = userService.get(buddyUserId).getDisplayName();
            note = "with " + buddyName;
            ProgressLog mine = logs.save(ProgressLog.challenge(me, leagueId, now, today, challengeId,
                    title, note, points, buddyUserId));
            if (logs.findFirstByUserIdAndLeagueIdAndChallengeIdAndLocalDate(buddyUserId, leagueId, challengeId, today).isEmpty()) {
                String myName = userService.get(me).getDisplayName();
                logs.save(ProgressLog.challenge(buddyUserId, leagueId, now, today, challengeId,
                        title, "with " + myName, points, me));
            }
            scoringService.recalculateLeague(leagueId);
            return LogResponse.from(mine);
        }

        ProgressLog log = logs.save(ProgressLog.challenge(me, leagueId, now, today, challengeId,
                title, note, points));
        scoringService.recalculateLeague(leagueId);
        return LogResponse.from(log);
    }

    /** Undo today's completion of a daily challenge (and the linked buddy log, if any). */
    @Transactional
    public void undoChallenge(Long me, Long leagueId, String challengeId) {
        leagueService.requireMember(leagueId, me);
        LocalDate today = TimeUtils.today(clock, userService.zoneOf(me));
        ProgressLog log = logs.findFirstByUserIdAndLeagueIdAndChallengeIdAndLocalDate(me, leagueId, challengeId, today)
                .orElseThrow(() -> ApiException.notFound("You haven't completed this challenge today"));
        Long buddyUserId = log.getBuddyUserId();
        logs.delete(log);
        if (buddyUserId != null) {
            // Only remove the buddy's log if it was awarded from this shared completion
            // (their buddyUserId points back at the completer), not an independent one.
            logs.findFirstByUserIdAndLeagueIdAndChallengeIdAndLocalDate(buddyUserId, leagueId, challengeId, today)
                    .filter(buddyLog -> me.equals(buddyLog.getBuddyUserId()))
                    .ifPresent(logs::delete);
        }
        scoringService.recalculateLeague(leagueId);
    }

    public Optional<LogResponse> runningTimer(Long me) {
        return logs.findFirstByUserIdAndEndedAtIsNull(me).map(LogResponse::from);
    }

    /** userId is optional: leave it out to get everyone's logs in the league. */
    public List<LogResponse> logsForLeague(Long me, Long leagueId, Long userId) {
        leagueService.requireMember(leagueId, me);
        List<ProgressLog> found = userId == null
                ? logs.findByLeagueIdOrderByStartedAtDesc(leagueId)
                : logs.findByLeagueIdAndUserIdOrderByStartedAtDesc(leagueId, userId);
        return found.stream().map(LogResponse::from).toList();
    }

    @Transactional
    public void delete(Long me, Long logId) {
        ProgressLog log = getOwnLog(me, logId);
        logs.delete(log);
        scoringService.recalculateLeague(log.getLeagueId());
    }

    private ProgressLog getOwnLog(Long me, Long logId) {
        ProgressLog log = logs.findById(logId).orElseThrow(() -> ApiException.notFound("Log not found"));
        if (!log.getUserId().equals(me)) {
            throw ApiException.forbidden("That's not your log");
        }
        return log;
    }

    private void requireLeagueActive(League league, LocalDate day) {
        if (!league.isActiveOn(day)) {
            throw ApiException.badRequest("This league runs from " + league.getStartDate() + " to "
                    + league.getEndDate() + ", so " + day + " doesn't count");
        }
    }
}
