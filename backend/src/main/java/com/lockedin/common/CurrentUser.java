package com.lockedin.common;

// TODO: single place every controller gets the logged-in userId.
//   1. Read userId from the SecurityContext (set by account.auth.JwtAuthFilter).
//   2. TEMPORARY fallback until auth works: read the X-User-Id header.
//   Remove the fallback before deploying.
public class CurrentUser {
}
