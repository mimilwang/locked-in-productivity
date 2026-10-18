package com.lockedin.account.images;

import com.lockedin.common.ApiException;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * Saves uploads in the shared database so every backend instance and client device can serve them.
 * The local folder remains as a read-only fallback for images uploaded before this change.
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
    private final StoredImageRepository images;

    public ImageStorageService(@Value("${images.upload-dir:uploads}") String uploadDir,
                               StoredImageRepository images) {
        this.uploadDir = Path.of(uploadDir).toAbsolutePath().normalize();
        this.images = images;
        try {
            Files.createDirectories(this.uploadDir);
        } catch (IOException e) {
            throw new UncheckedIOException("Could not create image folder " + this.uploadDir, e);
        }
    }

    /** Returns the URL path to use in photoUrl, e.g. "/images/3f2b...png". */
    @Transactional
    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("No file uploaded");
        }
        String extension = EXTENSIONS.get(file.getContentType());
        if (extension == null) {
            throw ApiException.badRequest("Only JPG, PNG or WEBP images are allowed");
        }
        String filename = UUID.randomUUID() + "." + extension;
        try {
            images.save(new StoredImage(filename, file.getContentType(), file.getBytes()));
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not save the image");
        }
        return "/images/" + filename;
    }

    @Transactional(readOnly = true)
    public Resource load(String filename) {
        if (!SAFE_NAME.matcher(filename).matches()) {
            throw ApiException.notFound("Image not found");
        }
        StoredImage stored = images.findById(filename).orElse(null);
        if (stored != null) {
            return new ByteArrayResource(stored.getData());
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
