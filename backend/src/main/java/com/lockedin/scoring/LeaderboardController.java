package com.lockedin.scoring;

import com.lockedin.common.CurrentUser;
import com.lockedin.scoring.dto.LeaderboardEntry;
import com.lockedin.scoring.dto.LeagueOverview;
import com.lockedin.scoring.dto.ScoreEventResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/leagues/{leagueId}")
@Tag(name = "Leaderboards & scores")
public class LeaderboardController {

    private final LeaderboardService leaderboardService;
    private final CurrentUser currentUser;

    public LeaderboardController(LeaderboardService leaderboardService, CurrentUser currentUser) {
        this.leaderboardService = leaderboardService;
        this.currentUser = currentUser;
    }

    @GetMapping("/leaderboard")
    @Operation(summary = "Rankings. period = daily (points gained today) | weekly (0-100, default) | "
            + "monthly (points this month: the race for MVP) | total. Each row has weeklyPercent and standing.")
    public List<LeaderboardEntry> leaderboard(@PathVariable Long leagueId,
                                              @RequestParam(defaultValue = "weekly") String period) {
        return leaderboardService.leaderboard(currentUser.id(), leagueId, LeaderboardPeriod.parse(period));
    }

    @GetMapping("/overview")
    @Operation(summary = "Everything for the league overview page: today's leader, weekly stats, group goal")
    public LeagueOverview overview(@PathVariable Long leagueId) {
        return leaderboardService.overview(currentUser.id(), leagueId);
    }

    @GetMapping("/scores")
    @Operation(summary = "Point-by-point breakdown. Defaults to you; add ?userId= for someone else.")
    public List<ScoreEventResponse> breakdown(@PathVariable Long leagueId,
                                              @RequestParam(required = false) Long userId) {
        return leaderboardService.breakdown(currentUser.id(), leagueId, userId);
    }
}
