package com.lockedin.league;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.lockedin.TestFixtures;
import com.lockedin.account.auth.AuthService;
import com.lockedin.common.ApiException;
import com.lockedin.league.dto.CreateLeagueRequest;
import com.lockedin.league.dto.JoinLeagueRequest;
import com.lockedin.league.dto.LeagueResponse;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class LeagueServiceTest {

    @Autowired
    AuthService auth;
    @Autowired
    LeagueService leagues;

    private LeagueResponse join(Long userId, String code) {
        return leagues.join(userId, new JoinLeagueRequest(code, null, true));
    }

    @Test
    void creatorBecomesOwnerWithAnInviteCode() {
        Long owner = TestFixtures.newUser(auth, "Owner");
        LeagueResponse league = leagues.create(owner, TestFixtures.league(300));

        assertEquals(MemberRole.OWNER, league.myRole());
        assertEquals(1, league.memberCount());
        assertEquals(6, league.inviteCode().length());
        assertFalse(league.readyToStart());
        assertEquals(league.startDate().plusWeeks(4).minusDays(1), league.endDate());
    }

    @Test
    void mustAgreeToRulesToJoin() {
        Long owner = TestFixtures.newUser(auth, "Owner");
        Long other = TestFixtures.newUser(auth, "Other");
        String code = leagues.create(owner, TestFixtures.league(300)).inviteCode();

        ApiException e = assertThrows(ApiException.class,
                () -> leagues.join(other, new JoinLeagueRequest(code, null, false)));
        assertEquals(HttpStatus.BAD_REQUEST, e.getStatus());
    }

    @Test
    void inviteCodeIsNotCaseSensitive() {
        Long owner = TestFixtures.newUser(auth, "Owner");
        Long other = TestFixtures.newUser(auth, "Other");
        String code = leagues.create(owner, TestFixtures.league(300)).inviteCode();

        assertEquals(MemberRole.MEMBER, join(other, code.toLowerCase()).myRole());
    }

    @Test
    void cannotJoinTwice() {
        Long owner = TestFixtures.newUser(auth, "Owner");
        String code = leagues.create(owner, TestFixtures.league(300)).inviteCode();

        ApiException e = assertThrows(ApiException.class, () -> join(owner, code));
        assertEquals(HttpStatus.CONFLICT, e.getStatus());
    }

    @Test
    void readyToStartAtFourMembers() {
        Long owner = TestFixtures.newUser(auth, "Owner");
        String code = leagues.create(owner, TestFixtures.league(300)).inviteCode();
        join(TestFixtures.newUser(auth, "A"), code);
        join(TestFixtures.newUser(auth, "B"), code);
        LeagueResponse afterFourth = join(TestFixtures.newUser(auth, "C"), code);

        assertEquals(4, afterFourth.memberCount());
        assertTrue(afterFourth.readyToStart());
    }

    @Test
    void leagueIsFullAtFifteen() {
        Long owner = TestFixtures.newUser(auth, "Owner");
        String code = leagues.create(owner, TestFixtures.league(300)).inviteCode();
        for (int i = 2; i <= LeagueService.MAX_MEMBERS; i++) {
            join(TestFixtures.newUser(auth, "Member" + i), code);
        }
        Long sixteenth = TestFixtures.newUser(auth, "Sixteenth");

        ApiException e = assertThrows(ApiException.class, () -> join(sixteenth, code));
        assertEquals(HttpStatus.CONFLICT, e.getStatus());
    }

    @Test
    void startDateCannotBeInThePast() {
        Long owner = TestFixtures.newUser(auth, "Owner");
        CreateLeagueRequest past = new CreateLeagueRequest("Old", "Goal", GoalType.MINUTES, 300,
                LocalDate.now().minusDays(7), 4, null, "Reward", "Punishment", List.of(), null);

        ApiException e = assertThrows(ApiException.class, () -> leagues.create(owner, past));
        assertEquals(HttpStatus.BAD_REQUEST, e.getStatus());
    }

    @Test
    void nonMembersCannotSeeTheLeague() {
        Long owner = TestFixtures.newUser(auth, "Owner");
        Long stranger = TestFixtures.newUser(auth, "Stranger");
        Long leagueId = leagues.create(owner, TestFixtures.league(300)).id();

        ApiException e = assertThrows(ApiException.class, () -> leagues.get(stranger, leagueId));
        assertEquals(HttpStatus.FORBIDDEN, e.getStatus());
    }

    @Test
    void wrongInviteCodeIsNotFound() {
        Long user = TestFixtures.newUser(auth, "User");
        ApiException e = assertThrows(ApiException.class, () -> join(user, "ZZZZZZ"));
        assertEquals(HttpStatus.NOT_FOUND, e.getStatus());
    }
}
