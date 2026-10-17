# Locked In Backend (Spring Boot, Java 21)

## Run
```
cd backend
mvn spring-boot:run
```
- API: http://localhost:8080
- Swagger docs: http://localhost:8080/swagger-ui.html
- H2 database console: http://localhost:8080/h2-console (JDBC URL `jdbc:h2:mem:lockedin`)

## Package ownership
| Package | Owner | What's in it |
|---|---|---|
| `league/` | Renee | Leagues, memberships, invite codes, join rules |
| `progress/` | Renee | Timer + manual progress logs |
| `scoring/` | Renee | Points, streaks, leaderboards, monthly MVP/Chud |
| `common/` | Shared | Errors, time zone utils, CORS, current user |
| `account/` | Shreya | Auth, profiles, friends, images (to be added) |

## Scoring
Every point value is in `src/main/resources/application.yml` under `scoring:`.
Change numbers there, not in Java code.
