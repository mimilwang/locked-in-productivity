package com.lockedin.progress;

import com.lockedin.common.CurrentUser;
import com.lockedin.progress.dto.CompleteChallengeRequest;
import com.lockedin.progress.dto.LogResponse;
import com.lockedin.progress.dto.ManualLogRequest;
import com.lockedin.progress.dto.StartTimerRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Progress logs & timer")
public class ProgressController {

    private final ProgressService progressService;
    private final CurrentUser currentUser;

    public ProgressController(ProgressService progressService, CurrentUser currentUser) {
        this.progressService = progressService;
        this.currentUser = currentUser;
    }

    @PostMapping("/logs/start")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Start the timer for a league")
    public LogResponse start(@Valid @RequestBody StartTimerRequest request) {
        return progressService.startTimer(currentUser.id(), request);
    }

    @PostMapping("/logs/{logId}/stop")
    @Operation(summary = "Stop your running timer. Points update right away.")
    public LogResponse stop(@PathVariable Long logId) {
        return progressService.stopTimer(currentUser.id(), logId);
    }

    @GetMapping("/logs/running")
    @Operation(summary = "Your running timer, if any (204 No Content if none)")
    public ResponseEntity<LogResponse> running() {
        return progressService.runningTimer(currentUser.id())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @PostMapping("/logs")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Log minutes by hand (e.g. forgot to use the timer)")
    public LogResponse logManually(@Valid @RequestBody ManualLogRequest request) {
        return progressService.logManually(currentUser.id(), request);
    }

    @DeleteMapping("/logs/{logId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete one of your logs")
    public void delete(@PathVariable Long logId) {
        progressService.delete(currentUser.id(), logId);
    }

    @PostMapping("/leagues/{leagueId}/challenges/complete")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Complete today's daily challenge: bonus points on top, +1 task in task leagues")
    public LogResponse completeChallenge(@PathVariable Long leagueId, @Valid @RequestBody CompleteChallengeRequest request) {
        return progressService.completeChallenge(currentUser.id(), leagueId, request);
    }

    @DeleteMapping("/leagues/{leagueId}/challenges/{challengeId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Undo today's completion of a daily challenge")
    public void undoChallenge(@PathVariable Long leagueId, @PathVariable String challengeId) {
        progressService.undoChallenge(currentUser.id(), leagueId, challengeId);
    }

    @GetMapping("/leagues/{leagueId}/logs")
    @Operation(summary = "Logs in a league, newest first. Add ?userId= for one person.")
    public List<LogResponse> leagueLogs(@PathVariable Long leagueId, @RequestParam(required = false) Long userId) {
        return progressService.logsForLeague(currentUser.id(), leagueId, userId);
    }
}
