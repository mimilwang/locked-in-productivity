package com.lockedin.progress;

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

    List<ProgressLog> findByLeagueIdAndUserIdOrderByStartedAtDesc(Long leagueId, Long userId);

    /** Finished logs only. Running timers don't count for points yet. */
    @Query("select p from ProgressLog p where p.leagueId = :leagueId and p.endedAt is not null")
    List<ProgressLog> findCompletedByLeagueId(@Param("leagueId") Long leagueId);

    /** Every day the user logged real progress, across all leagues. Used for profile streaks. */
    @Query("select distinct p.localDate from ProgressLog p where p.userId = :userId and p.durationMinutes > 0")
    List<LocalDate> findActiveDatesByUserId(@Param("userId") Long userId);
}
