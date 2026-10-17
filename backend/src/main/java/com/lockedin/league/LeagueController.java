package com.lockedin.league;

import com.lockedin.common.CurrentUser;
import com.lockedin.league.dto.CreateLeagueRequest;
import com.lockedin.league.dto.JoinLeagueRequest;
import com.lockedin.league.dto.LeagueResponse;
import com.lockedin.league.dto.MemberResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/leagues")
@Tag(name = "Leagues")
public class LeagueController {

    private final LeagueService leagueService;
    private final CurrentUser currentUser;

    public LeagueController(LeagueService leagueService, CurrentUser currentUser) {
        this.leagueService = leagueService;
        this.currentUser = currentUser;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a league. You become its owner. Share the returned inviteCode.")
    public LeagueResponse create(@Valid @RequestBody CreateLeagueRequest request) {
        return leagueService.create(currentUser.id(), request);
    }

    @GetMapping
    @Operation(summary = "Leagues you're in")
    public List<LeagueResponse> myLeagues() {
        return leagueService.myLeagues(currentUser.id());
    }

    @GetMapping("/{leagueId}")
    @Operation(summary = "One league (members only)")
    public LeagueResponse get(@PathVariable Long leagueId) {
        return leagueService.get(currentUser.id(), leagueId);
    }

    @GetMapping("/invite/{inviteCode}")
    @Operation(summary = "Preview a league from its invite code (for the join page / join link)")
    public LeagueResponse preview(@PathVariable String inviteCode) {
        return leagueService.preview(currentUser.id(), inviteCode);
    }

    @PostMapping("/join")
    @Operation(summary = "Join with an invite code. agreedToRules must be true.")
    public LeagueResponse join(@Valid @RequestBody JoinLeagueRequest request) {
        return leagueService.join(currentUser.id(), request);
    }

    @GetMapping("/{leagueId}/members")
    @Operation(summary = "Members of a league")
    public List<MemberResponse> members(@PathVariable Long leagueId) {
        return leagueService.members(currentUser.id(), leagueId);
    }
}
