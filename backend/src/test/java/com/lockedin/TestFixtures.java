package com.lockedin;

import com.lockedin.account.auth.AuthService;
import com.lockedin.account.dto.SignUpRequest;
import com.lockedin.league.GoalType;
import com.lockedin.league.dto.CreateLeagueRequest;

/** Small helpers so tests don't repeat setup code. */
public final class TestFixtures {

    private TestFixtures() {
    }

    /** Signs up a user in Los Angeles time and returns their id. */
    public static Long newUser(AuthService auth, String name) {
        return auth.signUp(new SignUpRequest(name, name, name.toLowerCase() + "@test.com", "password123",
                "America/Los_Angeles", null, null)).user().id();
    }

    /** A 4-week TIME league starting today. */
    public static CreateLeagueRequest league(int weeklyTargetMinutes) {
        return league(GoalType.TIME, weeklyTargetMinutes);
    }

    public static CreateLeagueRequest league(GoalType goalType, int weeklyTarget) {
        return new CreateLeagueRequest("Test League", "Study every week", goalType, weeklyTarget,
                null, 4, null, "Free dinner", "Do a dare", null);
    }
}
