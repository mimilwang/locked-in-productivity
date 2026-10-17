package com.lockedin.account.images;

import com.lockedin.common.ApiException;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * Saves profile and league photos to a local folder (images.upload-dir) for the hackathon.
 * To move to S3 / Supabase Storage later, only this class needs to change.
 */
@Service
public class ImageStorageService {

    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/jpeg", "jpg",
            "image/png", "png",
            "image/webp", "webp");

    /** Only names we generated ourselves, so nobody can request "../../secret.txt". */
    private static final Pattern SAFE_NAME = Pattern.compile("^[a-f0-9\\-]{36}\\.(jpg|png|webp)$");

    private final Path uploadDir;

    public ImageStorageService(@Value("${images.upload-dir:uploads}") String uploadDir) {
        this.uploadDir = Path.of(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadDir);
        } catch (IOException e) {
            throw new UncheckedIOException("Could not create image folder " + this.uploadDir, e);
        }
    }

    /** Returns the URL path to use in photoUrl, e.g. "/images/3f2b...png". */
    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("No file uploaded");
        }
        String extension = EXTENSIONS.get(file.getContentType());
        if (extension == null) {
            throw ApiException.badRequest("Only JPG, PNG or WEBP images are allowed");
        }
        String filename = UUID.randomUUID() + "." + extension;
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, uploadDir.resolve(filename));
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not save the image");
        }
        return "/images/" + filename;
    }

    public Resource load(String filename) {
        if (!SAFE_NAME.matcher(filename).matches()) {
            throw ApiException.notFound("Image not found");
        }
        Path path = uploadDir.resolve(filename);
        if (!Files.exists(path)) {
            throw ApiException.notFound("Image not found");
        }
        return new FileSystemResource(path);
    }

    public MediaType mediaType(String filename) {
        if (filename.endsWith(".png")) {
            return MediaType.IMAGE_PNG;
        }
        if (filename.endsWith(".webp")) {
            return MediaType.parseMediaType("image/webp");
        }
        return MediaType.IMAGE_JPEG;
    }
}
