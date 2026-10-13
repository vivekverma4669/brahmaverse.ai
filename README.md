# Developer assignments

Two independent JavaScript applications in one repository:

```text
frontend/  React + Vite Fastor mobile food app (existing implementation preserved)
backend/   Express + MongoDB CRM REST API
```

Requires **Node.js 20.19+** and npm. The applications have separate manifests and lockfiles, and can be installed, run, tested and deployed independently. The food app retains its local mock authentication and cart; it does not depend on or connect to the CRM API.

## Frontend

```sh
cd frontend
npm ci
npm run dev
```

Open **http://127.0.0.1:5173**. Demo OTP: **123456**; no SMS is sent. The four screenshot-based screens, local assets, state persistence, numeric keypads and interactions are preserved. Build with `npm run build`. Full details: [frontend/README.md](frontend/README.md).

## Backend

```sh
cd backend
npm ci
```

Copy `.env.example` to `.env` (PowerShell: `Copy-Item .env.example .env`; macOS/Linux: `cp .env.example .env`). Set `MONGODB_URI` to local MongoDB or Atlas and replace `JWT_SECRET` with a random secret. Generate a secret with:

```sh
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
npm run dev
```

API: **http://localhost:5000/api**. Health: **http://localhost:5000/api/health**.

For a disposable demo without an installed MongoDB service, use `npm run demo` instead; this downloads and launches a real local MongoDB binary and generates a temporary JWT secret. Demo data is lost when the process stops. Normal `npm start` uses the persistent MongoDB configured in `.env`. Details, request examples, environment variables and response contracts: [backend/README.md](backend/README.md).

## Verification

Run within the relevant app:

```sh
# frontend/
npm test
npm run test:e2e
npm run build

# backend/
npm run check
npm test
```

Frontend browser tests use Microsoft Edge via Playwright. Backend integration tests use isolated real MongoDB via `mongodb-memory-server`, not mocked database writes; the first run downloads MongoDB 7.0.24 and later runs use the cache. Tests never clear your configured database. They verify five concurrent two-counselor claiming races, privacy, authentication, duplicate registrations, validation, pagination, CORS and error handling.

Optional root shortcuts: `npm run dev:frontend`, `npm run dev:backend`, `npm run build`, `npm run test:frontend`, `npm run test:frontend:e2e`, and `npm run test:backend`. Install dependencies separately in each application first.

Git metadata, license and repository configuration stay at the root. The original frontend README moved with the app. Moving the app did not change its 25 source, asset, test, dependency-manifest, lockfile and app-configuration files (verified with SHA-256 hashes).
