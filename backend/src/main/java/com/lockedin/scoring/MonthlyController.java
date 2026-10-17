package com.lockedin.scoring;

import com.lockedin.account.UserService;
import com.lockedin.common.CurrentUser;
import com.lockedin.common.TimeUtils;
import com.lockedin.league.LeagueService;
import com.lockedin.scoring.dto.MonthlyResultResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.Clock;
import java.time.YearMonth;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/leagues/{leagueId}/monthly")
@Tag(name = "Monthly results (MVP & Chud)")
public class MonthlyController {

    private final MonthlyResultsJob monthlyResults;
    private final LeagueService leagueService;
    private final UserService userService;
    private final CurrentUser currentUser;
    private final Clock clock;

    public MonthlyController(MonthlyResultsJob monthlyResults, LeagueService leagueService, UserService userService,
                             CurrentUser currentUser, Clock clock) {
        this.monthlyResults = monthlyResults;
        this.leagueService = leagueService;
        this.userService = userService;
        this.currentUser = currentUser;
        this.clock = clock;
    }

    @GetMapping
    @Operation(summary = "All finalized months for this league, newest first")
    public List<MonthlyResultResponse> history(@PathVariable Long leagueId) {
        return monthlyResults.history(currentUser.id(), leagueId);
    }

    @GetMapping("/{month}")
    @Operation(summary = "Results for one month, e.g. /monthly/2026-10")
    public MonthlyResultResponse get(@PathVariable Long leagueId, @PathVariable String month) {
        return monthlyResults.get(currentUser.id(), leagueId, YearMonth.parse(month));
    }

    @PostMapping("/finalize")
    @Operation(summary = "DEMO: crown MVP + Chud right now (owner only). month defaults to the current month.")
    public MonthlyResultResponse finalizeNow(@PathVariable Long leagueId,
                                             @RequestParam(required = false) String month) {
        Long me = currentUser.id();
        leagueService.requireOwner(leagueId, me);
        YearMonth target = month != null
                ? YearMonth.parse(month)
                : YearMonth.from(TimeUtils.today(clock, userService.zoneOf(me)));
        return monthlyResults.finalizeMonth(leagueId, target, true);
    }
}
