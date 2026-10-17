package com.lockedin.account.friends;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;

/** One friend request. requesterId sent it to addresseeId. */
@Entity
@Table(name = "friendships",
        uniqueConstraints = @UniqueConstraint(columnNames = {"requester_id", "addressee_id"}))
public class Friendship {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "requester_id", nullable = false)
    private Long requesterId;

    @Column(name = "addressee_id", nullable = false)
    private Long addresseeId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FriendshipStatus status;

    @Column(nullable = false)
    private Instant createdAt;

    private Instant respondedAt;

    protected Friendship() {
    }

    public Friendship(Long requesterId, Long addresseeId, Instant createdAt) {
        this.requesterId = requesterId;
        this.addresseeId = addresseeId;
        this.status = FriendshipStatus.PENDING;
        this.createdAt = createdAt;
    }

    public void accept(Instant now) {
        this.status = FriendshipStatus.ACCEPTED;
        this.respondedAt = now;
    }

    public void decline(Instant now) {
        this.status = FriendshipStatus.DECLINED;
        this.respondedAt = now;
    }

    public void reopen(Instant now) {
        this.status = FriendshipStatus.PENDING;
        this.createdAt = now;
        this.respondedAt = null;
    }

    /** The person in this friendship who isn't userId. */
    public Long otherUser(Long userId) {
        return requesterId.equals(userId) ? addresseeId : requesterId;
    }

    public Long getId() {
        return id;
    }

    public Long getRequesterId() {
        return requesterId;
    }

    public Long getAddresseeId() {
        return addresseeId;
    }

    public FriendshipStatus getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
