package com.lockedin.scoring;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ScoreEventRepository extends JpaRepository<ScoreEvent, Long> {

    List<ScoreEvent> findByLeagueIdAndDateBetween(Long leagueId, LocalDate from, LocalDate to);

    List<ScoreEvent> findByLeagueIdAndUserIdOrderByDateAsc(Long leagueId, Long userId);

    @Modifying
    @Query("delete from ScoreEvent e where e.leagueId = :leagueId")
    void deleteByLeagueId(@Param("leagueId") Long leagueId);
}
