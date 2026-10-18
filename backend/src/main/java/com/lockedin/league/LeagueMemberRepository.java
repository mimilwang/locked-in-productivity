package com.lockedin.league;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LeagueMemberRepository extends JpaRepository<LeagueMember, Long> {

    long countByLeagueId(Long leagueId);

    boolean existsByLeagueIdAndUserId(Long leagueId, Long userId);

    boolean existsByUserId(Long userId);

    Optional<LeagueMember> findByLeagueIdAndUserId(Long leagueId, Long userId);

    List<LeagueMember> findByLeagueIdOrderByJoinedAtAsc(Long leagueId);

    List<LeagueMember> findByUserId(Long userId);
}
