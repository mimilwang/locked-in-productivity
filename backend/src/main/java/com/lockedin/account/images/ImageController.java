package com.lockedin.account.images;

import com.lockedin.common.CurrentUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.Duration;
import java.util.Map;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Upload first, then put the returned url in your profile (PATCH /users/me) or league (POST /leagues).
 * The url is relative, so the frontend shows it as backendBaseUrl + url.
 */
@RestController
@RequestMapping("/images")
@Tag(name = "Images")
public class ImageController {

    private final ImageStorageService storage;
    private final CurrentUser currentUser;

    public ImageController(ImageStorageService storage, CurrentUser currentUser) {
        this.storage = storage;
        this.currentUser = currentUser;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Upload a JPG/PNG/WEBP (5MB max) as form field \"file\". Returns {\"url\": \"/images/...\"}")
    public Map<String, String> upload(@RequestParam("file") MultipartFile file) {
        currentUser.id(); // must be logged in to upload
        return Map.of("url", storage.store(file));
    }

    @GetMapping("/{filename}")
    @Operation(summary = "View an uploaded image")
    public ResponseEntity<Resource> view(@PathVariable String filename) {
        return ResponseEntity.ok()
                .contentType(storage.mediaType(filename))
                .cacheControl(CacheControl.maxAge(Duration.ofDays(30)))
                .body(storage.load(filename));
    }
}
