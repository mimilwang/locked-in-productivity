package com.lockedin.account.images;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import java.time.Instant;

/**
 * Profile / league / feed image bytes kept in the database so they travel with the user
 * across devices and survive ephemeral container disks (unlike a local uploads/ folder).
 */
@Entity
@Table(name = "stored_images")
public class StoredImage {

    @Id
    @Column(length = 48)
    private String id;

    @Column(nullable = false, length = 64)
    private String contentType;

    @Lob
    @Column(nullable = false)
    private byte[] data;

    @Column(nullable = false)
    private Instant createdAt;

    protected StoredImage() {
        // for JPA
    }

    public StoredImage(String id, String contentType, byte[] data, Instant createdAt) {
        this.id = id;
        this.contentType = contentType;
        this.data = data;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public String getContentType() {
        return contentType;
    }

    public byte[] getData() {
        return data;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
