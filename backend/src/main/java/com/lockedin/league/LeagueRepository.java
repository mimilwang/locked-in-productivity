package com.lockedin.league;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LeagueRepository extends JpaRepository<League, Long> {

    Optional<League> findByInviteCode(String inviteCode);

    boolean existsByInviteCode(String inviteCode);

    /** Leagues that were running at any point between from and to. */
    @Query("select l from League l where l.startDate <= :to and l.endDate >= :from")
    List<League> findActiveBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);
}
