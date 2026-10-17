package com.lockedin.account.friends;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    Optional<Friendship> findByRequesterIdAndAddresseeId(Long requesterId, Long addresseeId);

    List<Friendship> findByAddresseeIdAndStatus(Long addresseeId, FriendshipStatus status);

    @Query("select f from Friendship f where f.status = :status and (f.requesterId = :userId or f.addresseeId = :userId)")
    List<Friendship> findByUserAndStatus(@Param("userId") Long userId, @Param("status") FriendshipStatus status);
}
