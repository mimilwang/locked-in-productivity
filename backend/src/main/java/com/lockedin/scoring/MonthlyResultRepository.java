package com.lockedin.scoring;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MonthlyResultRepository extends JpaRepository<MonthlyResult, Long> {

    Optional<MonthlyResult> findByLeagueIdAndMonth(Long leagueId, String month);

    List<MonthlyResult> findByLeagueIdOrderByMonthDesc(Long leagueId);

    /** Every title a user has won (MVP) or "won" (Chud). */
    List<MonthlyResult> findByMvpUserIdOrChudUserId(Long mvpUserId, Long chudUserId);
}
