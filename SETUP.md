# Team Setup: What to Download

## Everyone
- [ ] **Git**: `git --version` to check (Mac: comes with Xcode tools, run `xcode-select --install`)
- [ ] **GitHub access** to `mimilwang/locked-in-productivity`
- [ ] **Node.js 22 LTS**: https://nodejs.org (needed to run the frontend locally, even for backend folks)
- [ ] **VS Code** or **IntelliJ IDEA**
- [ ] **Postman** or **Insomnia** (optional; Swagger UI also works for testing the API)

## Backend (Renee)
- [ ] **Java 21 JDK**: Eclipse Temurin 21, https://adoptium.net (Mac: `brew install --cask temurin@21`)
- [ ] **Maven**: `brew install maven` (check with `mvn -v`, should show Java 21)
- [ ] **IntelliJ IDEA Community**: https://www.jetbrains.com/idea/download (best for Spring Boot)
- [ ] Database: nothing to install for local development. H2 persists under `backend/data/`; use PostgreSQL for deployment.

## Frontend (Mimi, Jake)
- [ ] **VS Code** extensions: ESLint, Prettier
- [ ] Run once: `npm install` in the repo root
- [ ] Java 21 + Maven too, if you want to run the backend locally instead of using a deployed URL

## Check it works
```
# frontend (repo root)
npm install
npm run dev          # http://localhost:5173

# backend
cd backend
mvn spring-boot:run  # http://localhost:8080/swagger-ui.html
```

For testing from a phone, open the frontend using your computer's LAN address (for example,
`http://192.168.1.20:5173`). The backend accepts private-network development origins by default.
In production, set `CORS_ALLOWED_ORIGIN_PATTERNS` to the exact frontend origin.
