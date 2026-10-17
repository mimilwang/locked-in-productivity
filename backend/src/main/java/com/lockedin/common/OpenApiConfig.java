package com.lockedin.common;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

/**
 * Swagger setup. Click "Authorize" in Swagger UI and either paste a JWT from /auth/login (bearerAuth)
 * or, while testing, type a user id (devUserId).
 */
@Configuration
@OpenAPIDefinition(
        info = @Info(title = "Locked In API", version = "v1",
                description = "Leagues, progress logs, scoring, leaderboards and accounts for Locked In."),
        security = {@SecurityRequirement(name = "bearerAuth"), @SecurityRequirement(name = "devUserId")})
@SecurityScheme(name = "bearerAuth", type = SecuritySchemeType.HTTP, scheme = "bearer", bearerFormat = "JWT")
@SecurityScheme(name = "devUserId", type = SecuritySchemeType.APIKEY, in = SecuritySchemeIn.HEADER, paramName = "X-User-Id")
public class OpenApiConfig {
}
