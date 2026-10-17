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
| POST | `/leagues` | Create a league: name, goalDescription, goalType (TIME/TASKS), weeklyTarget, reward, punishment |
| GET | `/leagues` | Leagues you're in |
| GET | `/leagues/{id}` | One league |
| GET | `/leagues/invite/{code}` | Preview a league from its invite code (join page) |
| POST | `/leagues/join` | Join with `inviteCode`, `agreedToRules: true`, optional `avatarUrl` |
| GET | `/leagues/{id}/members` | Members |
| POST | `/logs/start` | Start the timer (`leagueId`) |
| POST | `/logs/{id}/stop` | Stop the timer |
| GET | `/logs/running` | Your running timer (204 if none) |
| POST | `/logs` | Log by hand: `leagueId`, `minutes` (required for TIME goals), optional `date`. In TASKS leagues each log = 1 task |
| DELETE | `/logs/{id}` | Delete one of your logs |
| GET | `/leagues/{id}/logs` | Logs in a league (`?userId=` optional) |
| GET | `/leagues/{id}/leaderboard?period=daily\|weekly\|monthly\|total` | Rankings |
| GET | `/leagues/{id}/overview` | Overview page: today's leader, weekly stats, group goal progress |
| GET | `/leagues/{id}/scores` | Point-by-point breakdown (`?userId=` optional) |
| GET | `/leagues/{id}/monthly` | Past monthly results |
| GET | `/leagues/{id}/monthly/{yyyy-MM}` | One month's MVP, Chud, standings, reward and punishment |
| POST | `/leagues/{id}/monthly/finalize` | **Demo:** crown MVP + Chud right now (owner only) |
| GET | `/health` | Is the backend up? |

Swagger has the full request and response shapes for each one.

## Scoring
Each league has **one weekly goal**, and every member has to hit it on their own.
Example: "5 hours of leetcode a week" means Renee needs 5 hours, Jake needs 5 hours, and so on.

- `goalType: TIME` means `weeklyTarget` is in minutes (5 hours = `300`). Each log adds its minutes,
  from the timer or typed in by hand. The frontend turns hours into minutes.
- `goalType: TASKS` means `weeklyTarget` is a number of tasks. Every log counts as 1 task.

| Rule | |
|---|---|
| Weekly points | % of the weekly goal done, **rounded down**. 50% = 50 points, 100% = 100 points |
| Cap | Max **100 points per week**. Going over the goal doesn't add more |
| Updates daily | Points are saved on the day you earn them. Going from 40% to 65% on Wednesday = +25 on Wednesday |
| Today tab (`period=daily`) | Points gained today, ranked. Each row also has `weeklyPercent` (e.g. "+25 today, 65% of goal") |
| Weekly (`period=weekly`) | This week's points (0-100), ranked |
| Monthly tab (`period=monthly`) | Points earned this calendar month: the race for MVP |
| `standing` | Every row: `LEADER` (1st), `CHUD_ZONE` (last) or `NONE`, so the frontend can highlight the MVP race and Chud territory |
| Monthly MVP / Chud | Most / fewest points earned during the calendar month. Picked automatically at 12:05am on the 1st |
| Streaks | Days in a row with a log. **Display only**, no points |

- Weeks start on Monday (`week-starts-on`).
- A log counts for the day it **started**, in the user's own time zone.
- A single log / timer counts up to 240 minutes (`max-log-minutes`).
- Leaderboard ties: more points, then more progress (minutes or tasks), then longer streak, then who joined first.
- `reward` and `punishment` are plain text the league creator writes. Monthly results return both, for the
  frontend to display.

The numbers live in `application.yml` under `scoring:`, and the logic in `scoring/ScoringEngine.java`
(tested in `ScoringEngineTest`).

## Packages
| Package | What's in it |
|---|---|
| `account/` | Users table, profiles, profile stats (streaks, badges, titles) |
| `account/auth/` | Sign up, log in, JWT, Spring Security config |
| `account/friends/` | Friend requests and friends list |
| `account/images/` | Profile + league photo uploads (saved to `uploads/`) |
| `league/` | Leagues, memberships, invite codes, join rules |
| `progress/` | Timer + manual progress logs |
| `scoring/` | Weekly-goal points, streaks, leaderboards, monthly MVP/Chud |
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
