package com.lockedin;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/** Calls the real HTTP endpoints, the same way the frontend will. */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ApiFlowIntegrationTest {

    @Autowired
    MockMvc mvc;
    @Autowired
    ObjectMapper json;

    private JsonNode signUp(String name) throws Exception {
        String body = json.writeValueAsString(Map.of(
                "name", name, "displayName", name.toLowerCase(), "email", name.toLowerCase() + "@test.com",
                "password", "password123", "timeZone", "America/Los_Angeles"));
        String response = mvc.perform(post("/auth/signup").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(response);
    }

    private static String bearer(JsonNode auth) {
        return "Bearer " + auth.get("token").asText();
    }

    @Test
    void healthAndSwaggerArePublic() throws Exception {
        mvc.perform(get("/health")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("ok"));
        mvc.perform(get("/v3/api-docs")).andExpect(status().isOk());
    }

    @Test
    void everythingElseNeedsALogin() throws Exception {
        mvc.perform(get("/leagues")).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("You need to log in"));
    }

    @Test
    void badInputGetsAClearError() throws Exception {
        mvc.perform(post("/auth/signup").contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"nope\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void devHeaderWorksWhileTesting() throws Exception {
        long id = signUp("Renee").get("user").get("id").asLong();
        mvc.perform(get("/users/me").header("X-User-Id", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("renee"));
    }

    @Test
    void createJoinLogAndSeeTheLeaderboard() throws Exception {
        JsonNode owner = signUp("Owner");
        JsonNode bee = signUp("Bee");

        String leagueBody = json.writeValueAsString(Map.of(
                "name", "Leetcode Grind", "goalDescription", "2 hours of leetcode a week", "goalType", "TIME",
                "weeklyTarget", 120, "reward", "Dinner", "punishment", "Dare"));
        JsonNode league = json.readTree(mvc.perform(post("/leagues").header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON).content(leagueBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString());
        long leagueId = league.get("id").asLong();
        String code = league.get("inviteCode").asText();

        mvc.perform(post("/leagues/join").header("Authorization", bearer(bee))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("inviteCode", code, "agreedToRules", true))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.memberCount").value(2));

        // Bee logs 60 of 120 minutes = 50% of the weekly goal = 50 points
        mvc.perform(post("/logs").header("Authorization", bearer(bee))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("leagueId", leagueId, "minutes", 60))))
                .andExpect(status().isCreated());

        mvc.perform(get("/leagues/" + leagueId + "/leaderboard?period=weekly").header("Authorization", bearer(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].displayName").value("bee"))
                .andExpect(jsonPath("$[0].points").value(50))
                .andExpect(jsonPath("$[0].rank").value(1))
                .andExpect(jsonPath("$[1].points").value(0));

        mvc.perform(get("/leagues/" + leagueId + "/overview").header("Authorization", bearer(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.membersHitWeeklyGoal").value(0))
                .andExpect(jsonPath("$.weeklyLeaderboard[0].points").value(50))
                .andExpect(jsonPath("$.memberCount").value(2));
    }
}
