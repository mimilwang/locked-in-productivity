# Locked In Backend (Spring Boot, Java 21)

## Run
```
cd backend
mvn spring-boot:run
```
- API: http://localhost:8080
- Swagger docs: http://localhost:8080/swagger-ui.html
- H2 database console: http://localhost:8080/h2-console (JDBC URL `jdbc:h2:mem:lockedin`)

## Packages (Renee owns all backend)
| Package | What's in it |
|---|---|
| `account/` | Users table, profiles, profile stats (streaks, badges, titles) |
| `account/auth/` | Sign up, log in, JWT, Spring Security config |
| `account/friends/` | Friend requests and friends list |
| `account/images/` | Profile + league photo uploads |
| `league/` | Leagues, memberships, invite codes, join rules |
| `progress/` | Timer + manual progress logs |
| `scoring/` | Points, streaks, leaderboards, monthly MVP/Chud |
| `common/` | Errors, time zone utils, CORS, current user |

## Rules between packages
- `account/` owns the `users` table. Every other table stores only a `user_id`, never a copy of user fields.
- Controllers get the logged-in user from `common.CurrentUser`: the JWT first, then a temporary `X-User-Id` header until auth works.

## Scoring
Every point value is in `src/main/resources/application.yml` under `scoring:`.
Change numbers there, not in Java code.
