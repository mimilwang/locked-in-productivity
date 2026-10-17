package com.lockedin.common;

import java.time.Instant;

/** The JSON shape of every error: {"status":400,"error":"Bad Request","message":"...","timestamp":"..."} */
public record ApiError(int status, String error, String message, Instant timestamp) {

    public static ApiError of(int status, String error, String message) {
        return new ApiError(status, error, message, Instant.now());
    }
}
