package com.lockedin.account;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

/** The users table. Every other table only stores a user_id that points here. */
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String displayName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    /** e.g. "America/Los_Angeles". Decides which calendar day a user's logs count for. */
    @Column(nullable = false)
    private String timeZone;

    private String profilePhotoUrl;

    @Column(length = 120)
    private String school;

    @Column(nullable = false)
    private Instant createdAt;

    protected User() {
        // for JPA
    }

    public User(String name, String displayName, String email, String passwordHash, String timeZone, Instant createdAt) {
        this.name = name;
        this.displayName = displayName;
        this.email = email;
        this.passwordHash = passwordHash;
        this.timeZone = timeZone;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public String getTimeZone() {
        return timeZone;
    }

    public void setTimeZone(String timeZone) {
        this.timeZone = timeZone;
    }

    public String getProfilePhotoUrl() {
        return profilePhotoUrl;
    }

    public void setProfilePhotoUrl(String profilePhotoUrl) {
        this.profilePhotoUrl = profilePhotoUrl;
    }

    public String getSchool() {
        return school;
    }

    public void setSchool(String school) {
        this.school = school;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
