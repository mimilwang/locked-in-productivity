package com.lockedin.scoring;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.lockedin.TestFixtures;
import com.lockedin.account.Badge;
import com.lockedin.account.UserService;
import com.lockedin.account.auth.AuthService;
import com.lockedin.account.dto.UserProfileResponse;
import com.lockedin.league.LeagueService;
import com.lockedin.league.dto.JoinLeagueRequest;
import com.lockedin.league.dto.LeagueResponse;
import com.lockedin.progress.ProgressService;
import com.lockedin.progress.dto.ManualLogRequest;
import com.lockedin.scoring.dto.MonthlyResultResponse;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class MonthlyResultsJobTest {

    @Autowired
    AuthService auth;
    @Autowired
    LeagueService leagues;
    @Autowired
    ProgressService progress;
    @Autowired
    MonthlyResultsJob job;
    @Autowired
    MonthlyResultRepository results;
    @Autowired
    UserService users;

    Long winner;
    Long middle;
    Long loser;
    Long leagueId;
    YearMonth thisMonth;

    @BeforeEach
    void setUp() {
        winner = TestFixtures.newUser(auth, "Winner");
        middle = TestFixtures.newUser(auth, "Middle");
        loser = TestFixtures.newUser(auth, "Loser");
        LeagueResponse league = leagues.create(winner, TestFixtures.league(1000));
        leagueId = league.id();
        leagues.join(middle, new JoinLeagueRequest(league.inviteCode(), null, true));
        leagues.join(loser, new JoinLeagueRequest(league.inviteCode(), null, true));

        progress.logManually(winner, new ManualLogRequest(leagueId, 120, null, null));
        progress.logManually(middle, new ManualLogRequest(leagueId, 60, null, null));
        progress.logManually(loser, new ManualLogRequest(leagueId, 10, null, null));
        thisMonth = YearMonth.now(ZoneId.of("America/Los_Angeles"));
    }

    @Test
    void picksMvpAndChud() {
        MonthlyResultResponse result = job.finalizeMonth(leagueId, thisMonth, false);

        assertEquals(winner, result.mvp().userId());
        assertEquals(loser, result.chud().userId());
        assertEquals(3, result.standings().size());
        assertTrue(List.of("Dare A", "Dare B").contains(result.punishment()));
        assertEquals("Free dinner", result.reward());
    }

    @Test
    void runningTwiceDoesNotCreateDuplicates() {
        MonthlyResultResponse first = job.finalizeMonth(leagueId, thisMonth, false);
        MonthlyResultResponse second = job.finalizeMonth(leagueId, thisMonth, false);

        assertEquals(1, results.findByLeagueIdOrderByMonthDesc(leagueId).size());
        assertEquals(first.finalizedAt(), second.finalizedAt());
    }

    @Test
    void titlesShowUpOnProfiles() {
        job.finalizeMonth(leagueId, thisMonth, false);

        UserProfileResponse mvp = users.profile(winner, true);
        assertEquals("MVP", mvp.titles().get(0).title());
        assertTrue(mvp.badges().contains(Badge.MVP));

        UserProfileResponse chud = users.profile(loser, true);
        assertEquals("CHUD", chud.titles().get(0).title());
    }
}
