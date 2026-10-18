# Deploy: Vercel (frontend) + Render (backend)

Profile pictures and the rest of the app only stay in sync across laptop/phone when **both** of these are true:

1. The Vercel build talks to your Render API (`VITE_API_URL`).
2. Render uses **Postgres** (not the default H2 in-memory DB) so users and `stored_images` survive restarts and sleep.

No S3/Cloudinary is required — photos live in Postgres with the user profile.

## Render (Spring Boot API)

1. Create a **PostgreSQL** database on Render.
2. Create a Web Service from this repo:
   - Root / Docker context: `backend`
   - Dockerfile: `backend/Dockerfile`
3. Set env vars:

| Variable | Value |
|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://HOST:5432/DB` (use `jdbc:postgresql://…`, not `postgres://…`) |
| `SPRING_DATASOURCE_USERNAME` | from Render Postgres |
| `SPRING_DATASOURCE_PASSWORD` | from Render Postgres |
| `JWT_SECRET` | ≥32 random characters |
| `AUTH_DEV_HEADER_ENABLED` | `false` |
| `APP_CORS_ALLOWED_ORIGINS` | your Vercel origin(s), comma-separated, e.g. `https://locked-in.vercel.app` |

Optional: add preview domains to `APP_CORS_ALLOWED_ORIGINS` if you use Vercel preview deployments.

## Vercel (React / Vite)

1. Root directory: repo root (where `package.json` and `vercel.json` live).
2. Build command: `npm run build` · Output: `dist`.
3. Set **build** env:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://YOUR-SERVICE.onrender.com` (no trailing slash) |

Rebuild after changing `VITE_API_URL` — Vite inlines it at build time. Image tags resolve to `${VITE_API_URL}/images/...`.

## Why laptop ≠ phone without this

- **Missing `PATCH` of `photoUrl`** (fixed in code): upload alone did not attach the URL to the user.
- **Disk uploads on Render**: the old `uploads/` folder is wiped on deploy/restart; DB storage fixes that.
- **H2 on Render**: every sleep/redeploy wipes accounts and photos — use Postgres.
- **Wrong/missing `VITE_API_URL`**: the SPA would call `localhost:8080`, which only works on a local machine.

## Smoke check after deploy

1. Sign up / log in on laptop → Profile → choose a photo (saves immediately).
2. On phone, open the same Vercel URL, log in as the same user → profile avatar should load from `https://YOUR-SERVICE.onrender.com/images/...`.
