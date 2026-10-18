package com.lockedin.account.images;

import com.lockedin.common.ApiException;
import java.io.IOException;
import java.time.Clock;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * Saves profile and league photos in the database so the same picture loads on every device.
 * To move to S3 / Supabase Storage later, only this class needs to change — URLs stay /images/...
 */
@Service
public class ImageStorageService {

    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/jpeg", "jpg",
            "image/png", "png",
            "image/webp", "webp");

    /** Only names we generated ourselves, so nobody can request "../../secret.txt". */
    private static final Pattern SAFE_NAME = Pattern.compile("^[a-f0-9\\-]{36}\\.(jpg|png|webp)$");

    private final StoredImageRepository images;
    private final Clock clock;

    public ImageStorageService(StoredImageRepository images, Clock clock) {
        this.images = images;
        this.clock = clock;
    }

    /** Returns the URL path to use in photoUrl, e.g. "/images/3f2b...png". */
    @Transactional
    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("No file uploaded");
        }
        String contentType = file.getContentType();
        String extension = EXTENSIONS.get(contentType);
        if (extension == null) {
            throw ApiException.badRequest("Only JPG, PNG or WEBP images are allowed");
        }
        String filename = UUID.randomUUID() + "." + extension;
        byte[] data;
        try {
            data = file.getBytes();
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not save the image");
        }
        if (data.length == 0) {
            throw ApiException.badRequest("No file uploaded");
        }
        images.save(new StoredImage(filename, contentType, data, clock.instant()));
        return "/images/" + filename;
    }

    @Transactional(readOnly = true)
    public Resource load(String filename) {
        if (!SAFE_NAME.matcher(filename).matches()) {
            throw ApiException.notFound("Image not found");
        }
        StoredImage image = images.findById(filename)
                .orElseThrow(() -> ApiException.notFound("Image not found"));
        return new ByteArrayResource(image.getData());
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
