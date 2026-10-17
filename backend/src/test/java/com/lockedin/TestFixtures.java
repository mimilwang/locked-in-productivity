package com.lockedin;

import com.lockedin.account.auth.AuthService;
import com.lockedin.account.dto.SignUpRequest;
import com.lockedin.league.GoalType;
import com.lockedin.league.dto.CreateLeagueRequest;
import java.util.List;

/** Small helpers so tests don't repeat setup code. */
public final class TestFixtures {

    private TestFixtures() {
    }

    /** Signs up a user in Los Angeles time and returns their id. */
    public static Long newUser(AuthService auth, String name) {
        return auth.signUp(new SignUpRequest(name, name, name.toLowerCase() + "@test.com", "password123",
                "America/Los_Angeles", null)).user().id();
    }

    /** A 4-week MINUTES league starting today. */
    public static CreateLeagueRequest league(int weeklyTargetMinutes) {
        return new CreateLeagueRequest("Test League", "Study every week", GoalType.MINUTES, weeklyTargetMinutes,
                null, 4, null, "Free dinner", "Do a dare", List.of("Dare A", "Dare B"), null);
    }
}
