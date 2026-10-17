package com.lockedin.account.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Runs on every request. If it finds a valid "Authorization: Bearer <token>" it marks the request as
 * logged in as that user. While auth.dev-header-enabled=true it also accepts "X-User-Id: 5" (testing only).
 *
 * Not a @Component on purpose: SecurityConfig creates it, so Spring doesn't also register it a second time.
 */
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final boolean devHeaderEnabled;

    public JwtAuthFilter(JwtService jwtService, boolean devHeaderEnabled) {
        this.jwtService = jwtService;
        this.devHeaderEnabled = devHeaderEnabled;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        Long userId = null;

        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            userId = jwtService.parseUserId(header.substring(7).trim()).orElse(null);
        }

        if (userId == null && devHeaderEnabled) {
            String devUserId = request.getHeader("X-User-Id");
            if (devUserId != null) {
                try {
                    userId = Long.parseLong(devUserId.trim());
                } catch (NumberFormatException ignored) {
                    // not a number: treat as logged out
                }
            }
        }

        if (userId != null) {
            var auth = new UsernamePasswordAuthenticationToken(userId, null, List.of());
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(auth);
            SecurityContextHolder.setContext(context);
        }
        chain.doFilter(request, response);
    }
}
