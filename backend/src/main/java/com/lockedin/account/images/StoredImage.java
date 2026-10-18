package com.lockedin.account.images;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

/** An uploaded image stored in the shared database so every app instance can serve it. */
@Entity
@Table(name = "stored_images")
public class StoredImage {

    @Id
    @Column(length = 41, nullable = false)
    private String filename;

    @Column(nullable = false, length = 30)
    private String contentType;

    @Lob
    @Column(nullable = false)
    private byte[] data;

    protected StoredImage() { }

    public StoredImage(String filename, String contentType, byte[] data) {
        this.filename = filename;
        this.contentType = contentType;
        this.data = data;
    }

    public String getFilename() { return filename; }
    public String getContentType() { return contentType; }
    public byte[] getData() { return data; }
}
