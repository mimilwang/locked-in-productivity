package com.lockedin.common;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * The one place every controller gets the logged-in user's id.
 *
 * account.auth.JwtAuthFilter puts the userId into the SecurityContext, either from
 * "Authorization: Bearer <token>" or (TEMPORARY, while auth.dev-header-enabled=true) from "X-User-Id: 1".
 */
@Component
public class CurrentUser {

    public Long id() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Long userId)) {
            throw ApiException.unauthorized("You need to log in");
        }
        return userId;
    }
}
