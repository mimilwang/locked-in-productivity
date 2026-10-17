package com.lockedin.common;

import com.lockedin.account.User;
import com.lockedin.account.UserRepository;
import com.lockedin.league.GoalType;
import com.lockedin.league.InviteCodeGenerator;
import com.lockedin.league.League;
import com.lockedin.league.LeagueMember;
import com.lockedin.league.LeagueMemberRepository;
import com.lockedin.league.LeagueRepository;
import com.lockedin.league.MemberRole;
import com.lockedin.progress.LogSource;
import com.lockedin.progress.ProgressLog;
import com.lockedin.progress.ProgressLogRepository;
import com.lockedin.scoring.ScoringService;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Random;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Fills the database with a demo league so the leaderboard looks alive.
 * Only runs with the "demo" profile:  mvn spring-boot:run -Dspring-boot.run.profiles=demo
 */
@Component
@Profile("demo")
public class DemoDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);
    private static final String PASSWORD = "password123";

    private final UserRepository users;
    private final LeagueRepository leagues;
    private final LeagueMemberRepository members;
    private final ProgressLogRepository logs;
    private final ScoringService scoringService;
    private final InviteCodeGenerator inviteCodes;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;

    public DemoDataSeeder(UserRepository users, LeagueRepository leagues, LeagueMemberRepository members,
                          ProgressLogRepository logs, ScoringService scoringService, InviteCodeGenerator inviteCodes,
                          PasswordEncoder passwordEncoder, Clock clock) {
        this.users = users;
        this.leagues = leagues;
        this.members = members;
        this.logs = logs;
        this.scoringService = scoringService;
        this.inviteCodes = inviteCodes;
        this.passwordEncoder = passwordEncoder;
        this.clock = clock;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (users.count() > 0) {
            return; // already seeded
        }
        String zone = "America/Los_Angeles";
        Instant now = clock.instant();
        LocalDate today = TimeUtils.today(clock, ZoneId.of(zone));
        String hash = passwordEncoder.encode(PASSWORD);

        // name, how likely they are to log on a given day (so the leaderboard has a spread)
        List<Object[]> people = List.of(
                new Object[]{"Renee", 0.9}, new Object[]{"Mimi", 0.75}, new Object[]{"Jake", 0.6},
                new Object[]{"Shreya", 0.8}, new Object[]{"Alex", 0.3});

        List<User> created = people.stream().map(p -> {
            String name = (String) p[0];
            return users.save(new User(name, name.toLowerCase(), name.toLowerCase() + "@lockedin.dev", hash, zone, now));
        }).toList();

        League league = leagues.save(new League("Study Grind", "Study 5 hours a week", GoalType.TIME, 300,
                today.minusDays(13), today.minusDays(13).plusWeeks(4).minusDays(1), inviteCodes.generate(), null,
                "Winner's dinner is covered by everyone else", "Wear a costume to class for a day",
                created.get(0).getId(), now));

        for (int i = 0; i < created.size(); i++) {
            members.save(new LeagueMember(league.getId(), created.get(i).getId(), null,
                    i == 0 ? MemberRole.OWNER : MemberRole.MEMBER, now, now.plusSeconds(i)));
        }

        Random random = new Random(42); // same "random" data every time
        for (int i = 0; i < created.size(); i++) {
            double chance = (Double) people.get(i)[1];
            for (int daysAgo = 13; daysAgo >= 0; daysAgo--) {
                if (random.nextDouble() < chance) {
                    int minutes = 20 + random.nextInt(100);
                    logs.save(new ProgressLog(created.get(i).getId(), league.getId(), now, now, minutes,
                            LogSource.MANUAL, today.minusDays(daysAgo), "demo"));
                }
            }
        }
        scoringService.recalculateLeague(league.getId());

        log.info("Demo data loaded. Log in as renee@lockedin.dev / {} (or X-User-Id: {}). League id {} invite code {}",
                PASSWORD, created.get(0).getId(), league.getId(), league.getInviteCode());
    }
}
