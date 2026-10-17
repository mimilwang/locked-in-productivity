# Locked In Backend (Spring Boot, Java 21)

## Run it
```
cd backend
mvn spring-boot:run                                    # empty database
mvn spring-boot:run -Dspring-boot.run.profiles=demo    # with a demo league + 2 weeks of logs
mvn test                                               # run all tests
```
- API: http://localhost:8080
- Swagger (docs + try every endpoint): http://localhost:8080/swagger-ui.html
- Database viewer: http://localhost:8080/h2-console (JDBC URL `jdbc:h2:mem:lockedin`, user `sa`, no password)

Demo mode logins: `renee@lockedin.dev`, `mimi@lockedin.dev`, `jake@lockedin.dev`, `shreya@lockedin.dev`,
`alex@lockedin.dev`, all with password `password123`. The console prints the league id and invite code.

The H2 database lives in memory, so it resets every time the app restarts.

## Logging in from the frontend
1. `POST /auth/signup` or `POST /auth/login` returns `{ "token": "...", "user": {...} }`.
2. Send the token on every other request: `Authorization: Bearer <token>`.
3. **Testing shortcut:** while `auth.dev-header-enabled: true`, you can send `X-User-Id: 1` instead of a token.
   Turn it off before deploying.

Errors always look like `{ "status": 400, "error": "Bad Request", "message": "...", "timestamp": "..." }`.
Show `message` to the user.

## Endpoints

| Method | URL | What it does |
|---|---|---|
| POST | `/auth/signup` | Create an account (name, displayName, email, password, timeZone, photoUrl?) |
| POST | `/auth/login` | Log in (email, password) |
| GET | `/users/me` | Your profile: streaks, badges, past MVP/Chud titles |
| PATCH | `/users/me` | Update displayName / name / timeZone / photoUrl |
| GET | `/users/{id}` | Someone else's profile |
| GET | `/friends` | Your friends |
| GET | `/friends/requests` | Requests waiting for you |
| POST | `/friends/requests` | Send a request (userId or email) |
| POST | `/friends/requests/{id}/accept` · `/decline` | Answer a request |
| POST | `/images` | Upload a photo (form field `file`), returns `{ "url": "/images/..." }` |
| GET | `/images/{filename}` | View a photo (public) |
| POST | `/leagues` | Create a league (you become owner) |
| GET | `/leagues` | Leagues you're in |
| GET | `/leagues/{id}` | One league |
| GET | `/leagues/invite/{code}` | Preview a league from its invite code (join page) |
| POST | `/leagues/join` | Join with `inviteCode`, `agreedToRules: true`, optional `avatarUrl` |
| GET | `/leagues/{id}/members` | Members |
| POST | `/logs/start` | Start the timer (`leagueId`) |
| POST | `/logs/{id}/stop` | Stop the timer |
| GET | `/logs/running` | Your running timer (204 if none) |
| POST | `/logs` | Log minutes by hand (`leagueId`, `minutes`, optional `date`) |
| DELETE | `/logs/{id}` | Delete one of your logs |
| GET | `/leagues/{id}/logs` | Logs in a league (`?userId=` optional) |
| GET | `/leagues/{id}/leaderboard?period=daily\|weekly\|monthly\|total` | Rankings |
| GET | `/leagues/{id}/overview` | Overview page: today's leader, weekly stats, group goal progress |
| GET | `/leagues/{id}/scores` | Point-by-point breakdown (`?userId=` optional) |
| GET | `/leagues/{id}/monthly` | Past monthly results |
| GET | `/leagues/{id}/monthly/{yyyy-MM}` | One month's MVP, Chud, standings, wheel result |
| POST | `/leagues/{id}/monthly/finalize` | **Demo:** crown MVP + Chud right now (owner only) |
| GET | `/health` | Is the backend up? |

Swagger has the full request and response shapes for each one.

## Scoring
All numbers live in `src/main/resources/application.yml` under `scoring:`. Change them there, not in Java.

| Points | Rule |
|---|---|
| Minutes | 1 point per 10 minutes logged that day, max 30 per day |
| Streak | From day 2 of a streak: streak length × 2, max 10 per day |
| Weekly goal | +20 on the day your weekly total reaches the league's target (once per week) |
| Group bonus | +5 to everyone, once per week, when **every** member hits the target |

- Weeks start on Monday (`week-starts-on`).
- A log counts for the day it **started**, in the user's own time zone.
- Timers stop counting at 240 minutes (`max-log-minutes`).
- Leaderboard ties: more points, then more minutes, then longer streak, then who joined first.
- MVP = 1st place for the month, Chud = last place. The punishment wheel picks one of the league's `wheelOptions`.
  This runs automatically at 12:05am on the 1st (`monthly-results.cron`).

**To add a new way to earn points:** add a value to `ScoreReason`, a number to `ScoringRules` + `application.yml`,
the logic in `ScoringEngine`, and a test in `ScoringEngineTest`.

## Packages
| Package | What's in it |
|---|---|
| `account/` | Users table, profiles, profile stats (streaks, badges, titles) |
| `account/auth/` | Sign up, log in, JWT, Spring Security config |
| `account/friends/` | Friend requests and friends list |
| `account/images/` | Profile + league photo uploads (saved to `uploads/`) |
| `league/` | Leagues, memberships, invite codes, join rules |
| `progress/` | Timer + manual progress logs |
| `scoring/` | Points engine, streaks, leaderboards, monthly MVP/Chud |
| `common/` | Errors, time zone utils, CORS, current user, Swagger setup, demo data |

Each feature follows Controller (URLs) → Service (rules) → Repository (database) → Entity (table), with DTOs for JSON.

- `account/` owns the `users` table. Every other table stores only a `user_id`.
- Controllers get the logged-in user from `common.CurrentUser`.
- Scores are a ledger (`score_events`). Any change to logs or members re-scores the whole league, which is fast
  because leagues have at most 15 people.

## Deploying
Set these environment variables:
```
SPRING_DATASOURCE_URL=jdbc:postgresql://<host>:5432/<db>
SPRING_DATASOURCE_USERNAME=...
SPRING_DATASOURCE_PASSWORD=...
JWT_SECRET=<at least 32 random characters>
AUTH_DEV_HEADER_ENABLED=false
APP_CORS_ALLOWED_ORIGINS=https://<your-frontend-url>
```
