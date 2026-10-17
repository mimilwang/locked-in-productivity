package com.lockedin.account.auth;

import static org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Which URLs need a login. Public: sign up/log in, health, Swagger, H2 console, viewing images.
 * Everything else needs a JWT (or the temporary X-User-Id header).
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtService jwtService,
                                                   @Value("${auth.dev-header-enabled:false}") boolean devHeaderEnabled)
            throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // no cookies, so CSRF doesn't apply
                .cors(Customizer.withDefaults()) // uses CorsConfig
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .headers(h -> h.frameOptions(f -> f.sameOrigin())) // H2 console uses frames
                .httpBasic(b -> b.disable())
                .formLogin(f -> f.disable())
                .exceptionHandling(e -> e.authenticationEntryPoint((request, response, ex) -> {
                    response.setStatus(401);
                    response.setContentType("application/json");
                    response.getWriter().write(
                            "{\"status\":401,\"error\":\"Unauthorized\",\"message\":\"You need to log in\"}");
                }))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(antMatcher(HttpMethod.OPTIONS, "/**")).permitAll()
                        .requestMatchers(
                                antMatcher("/auth/**"),
                                antMatcher("/health"),
                                antMatcher("/error"),
                                antMatcher("/swagger-ui.html"),
                                antMatcher("/swagger-ui/**"),
                                antMatcher("/v3/api-docs/**"),
                                antMatcher("/h2-console/**")).permitAll()
                        .requestMatchers(antMatcher(HttpMethod.GET, "/images/**")).permitAll()
                        .anyRequest().authenticated())
                .addFilterBefore(new JwtAuthFilter(jwtService, devHeaderEnabled),
                        UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
