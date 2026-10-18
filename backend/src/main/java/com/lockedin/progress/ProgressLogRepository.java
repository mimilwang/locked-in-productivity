package com.lockedin.progress;

import com.lockedin.league.GoalType;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProgressLogRepository extends JpaRepository<ProgressLog, Long> {

    /** A user's running timer, if any (endedAt is null). */
    Optional<ProgressLog> findFirstByUserIdAndEndedAtIsNull(Long userId);

    List<ProgressLog> findByLeagueIdOrderByStartedAtDesc(Long leagueId);

    /** Today's completion of one daily challenge, if any. */
    Optional<ProgressLog> findFirstByUserIdAndLeagueIdAndChallengeIdAndLocalDate(
            Long userId, Long leagueId, String challengeId, LocalDate localDate);

    List<ProgressLog> findByLeagueIdAndUserIdOrderByStartedAtDesc(Long leagueId, Long userId);

    /** Finished logs only. Running timers don't count for points yet. */
    @Query("select p from ProgressLog p where p.leagueId = :leagueId and p.endedAt is not null")
    List<ProgressLog> findCompletedByLeagueId(@Param("leagueId") Long leagueId);

    /**
     * Every day the user logged real progress, across all leagues. Used for profile streaks.
     * Counts any finished log in a TASKS league, and logs with minutes in a TIME league.
     */
    @Query("select distinct p.localDate from ProgressLog p, League l where l.id = p.leagueId and p.userId = :userId"
            + " and p.endedAt is not null and (p.durationMinutes > 0 or l.goalType = :tasks)")
    List<LocalDate> findActiveDates(@Param("userId") Long userId, @Param("tasks") GoalType tasks);

    default List<LocalDate> findActiveDatesByUserId(Long userId) {
        return findActiveDates(userId, GoalType.TASKS);
    }
}
