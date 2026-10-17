package com.lockedin.account;

import com.lockedin.account.dto.TitleResponse;
import com.lockedin.common.TimeUtils;
import com.lockedin.league.League;
import com.lockedin.league.LeagueRepository;
import com.lockedin.progress.ProgressLogRepository;
import com.lockedin.scoring.MonthlyResult;
import com.lockedin.scoring.MonthlyResultRepository;
import com.lockedin.scoring.StreakCalculator;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

/** Profile fields that come from other packages: streaks, badges, and past MVP/Chud titles. */
@Service
public class ProfileStatsService {

    public record ProfileStats(int currentStreak, int bestStreak, List<Badge> badges, List<TitleResponse> titles) {
    }

    private final ProgressLogRepository logs;
    private final MonthlyResultRepository monthlyResults;
    private final LeagueRepository leagues;
    private final Clock clock;

    public ProfileStatsService(ProgressLogRepository logs, MonthlyResultRepository monthlyResults,
                               LeagueRepository leagues, Clock clock) {
        this.logs = logs;
        this.monthlyResults = monthlyResults;
        this.leagues = leagues;
        this.clock = clock;
    }

    public ProfileStats forUser(Long userId, ZoneId zone) {
        // Streaks count any day with progress, across all of the user's leagues.
        Set<LocalDate> activeDays = new HashSet<>(logs.findActiveDatesByUserId(userId));
        LocalDate today = TimeUtils.today(clock, zone);
        int current = StreakCalculator.currentStreak(activeDays, today);
        int best = StreakCalculator.bestStreak(activeDays);

        List<MonthlyResult> results = monthlyResults.findByMvpUserIdOrChudUserId(userId, userId);
        Map<Long, String> leagueNames = leagues.findAllById(
                        results.stream().map(MonthlyResult::getLeagueId).collect(Collectors.toSet()))
                .stream().collect(Collectors.toMap(League::getId, League::getName));

        List<TitleResponse> titles = new ArrayList<>();
        for (MonthlyResult r : results) {
            String leagueName = leagueNames.getOrDefault(r.getLeagueId(), "Unknown league");
            if (userId.equals(r.getMvpUserId())) {
                titles.add(new TitleResponse("MVP", r.getLeagueId(), leagueName, r.getMonth()));
            }
            if (userId.equals(r.getChudUserId())) {
                titles.add(new TitleResponse("CHUD", r.getLeagueId(), leagueName, r.getMonth()));
            }
        }
        titles.sort(Comparator.comparing(TitleResponse::month).reversed());

        List<Badge> badges = new ArrayList<>();
        if (!activeDays.isEmpty()) {
            badges.add(Badge.FIRST_LOG);
        }
        if (best >= 3) {
            badges.add(Badge.THREE_DAY_STREAK);
        }
        if (best >= 7) {
            badges.add(Badge.SEVEN_DAY_STREAK);
        }
        Set<String> titleTypes = titles.stream().map(TitleResponse::title).collect(Collectors.toSet());
        if (titleTypes.contains("MVP")) {
            badges.add(Badge.MVP);
        }
        if (titleTypes.contains("CHUD")) {
            badges.add(Badge.CHUD);
        }
        return new ProfileStats(current, best, badges, titles);
    }
}
