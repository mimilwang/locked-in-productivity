package com.lockedin.progress;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.lockedin.TestFixtures;
import com.lockedin.account.auth.AuthService;
import com.lockedin.common.ApiException;
import com.lockedin.league.LeagueService;
import com.lockedin.progress.dto.LogResponse;
import com.lockedin.progress.dto.ManualLogRequest;
import com.lockedin.progress.dto.StartTimerRequest;
import com.lockedin.scoring.LeaderboardPeriod;
import com.lockedin.scoring.LeaderboardService;
import java.time.LocalDate;
import java.time.ZoneId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class ProgressServiceTest {

    @Autowired
    AuthService auth;
    @Autowired
    LeagueService leagues;
    @Autowired
    ProgressService progress;
    @Autowired
    LeaderboardService leaderboards;

    Long me;
    Long leagueId;

    @BeforeEach
    void setUp() {
        me = TestFixtures.newUser(auth, "Renee");
        leagueId = leagues.create(me, TestFixtures.league(1000)).id();
    }

    private int myWeeklyPoints() {
        return leaderboards.leaderboard(me, leagueId, LeaderboardPeriod.WEEKLY).get(0).points();
    }

    @Test
    void manualLogAddsPointsRightAway() {
        progress.logManually(me, new ManualLogRequest(leagueId, 25, null, null));
        assertEquals(2, myWeeklyPoints());
    }

    @Test
    void onlyOneTimerAtATime() {
        progress.startTimer(me, new StartTimerRequest(leagueId, null));
        ApiException e = assertThrows(ApiException.class, () -> progress.startTimer(me, new StartTimerRequest(leagueId, null)));
        assertEquals(HttpStatus.CONFLICT, e.getStatus());
    }

    @Test
    void stoppingTheTimerEndsIt() {
        LogResponse started = progress.startTimer(me, new StartTimerRequest(leagueId, "reading"));
        assertTrue(started.running());
        assertTrue(progress.runningTimer(me).isPresent());

        LogResponse stopped = progress.stopTimer(me, started.id());
        assertFalse(stopped.running());
        assertTrue(progress.runningTimer(me).isEmpty());
    }

    @Test
    void cannotStopATimerTwice() {
        LogResponse started = progress.startTimer(me, new StartTimerRequest(leagueId, null));
        progress.stopTimer(me, started.id());
        ApiException e = assertThrows(ApiException.class, () -> progress.stopTimer(me, started.id()));
        assertEquals(HttpStatus.BAD_REQUEST, e.getStatus());
    }

    @Test
    void cannotLogInTheFuture() {
        LocalDate tomorrow = LocalDate.now(ZoneId.of("America/Los_Angeles")).plusDays(1);
        ApiException e = assertThrows(ApiException.class,
                () -> progress.logManually(me, new ManualLogRequest(leagueId, 30, tomorrow, null)));
        assertEquals(HttpStatus.BAD_REQUEST, e.getStatus());
    }

    @Test
    void cannotLogBeforeTheLeagueStarts() {
        LocalDate yesterday = LocalDate.now(ZoneId.of("America/Los_Angeles")).minusDays(1);
        ApiException e = assertThrows(ApiException.class,
                () -> progress.logManually(me, new ManualLogRequest(leagueId, 30, yesterday, null)));
        assertEquals(HttpStatus.BAD_REQUEST, e.getStatus());
    }

    @Test
    void logsHaveAMaximumLength() {
        ApiException e = assertThrows(ApiException.class,
                () -> progress.logManually(me, new ManualLogRequest(leagueId, 241, null, null)));
        assertEquals(HttpStatus.BAD_REQUEST, e.getStatus());
    }

    @Test
    void nonMembersCannotLog() {
        Long stranger = TestFixtures.newUser(auth, "Stranger");
        ApiException e = assertThrows(ApiException.class,
                () -> progress.logManually(stranger, new ManualLogRequest(leagueId, 30, null, null)));
        assertEquals(HttpStatus.FORBIDDEN, e.getStatus());
    }

    @Test
    void cannotStopSomeoneElsesTimer() {
        Long other = TestFixtures.newUser(auth, "Other");
        LogResponse started = progress.startTimer(me, new StartTimerRequest(leagueId, null));
        ApiException e = assertThrows(ApiException.class, () -> progress.stopTimer(other, started.id()));
        assertEquals(HttpStatus.FORBIDDEN, e.getStatus());
    }

    @Test
    void deletingALogRemovesItsPoints() {
        LogResponse log = progress.logManually(me, new ManualLogRequest(leagueId, 50, null, null));
        assertEquals(5, myWeeklyPoints());
        progress.delete(me, log.id());
        assertEquals(0, myWeeklyPoints());
    }
}
