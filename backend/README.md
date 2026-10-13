# CRM REST API

Node.js/Express 5, Mongoose/MongoDB, JWT (HS256), bcryptjs, express-validator, dotenv, CORS and Helmet. ESM JavaScript. Node.js 20.19+ required.

## Setup

```sh
cd backend
npm ci
```

Copy `.env.example` to `.env` using `Copy-Item .env.example .env` in PowerShell or `cp .env.example .env` on macOS/Linux. Configure MongoDB and replace the JWT placeholder with a random secret generated using:

```sh
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
npm run dev
```

`npm start` runs normally without watch mode. MongoDB must be available before the server starts. Initialization builds the unique employee email index before serving requests. For a local disposable demo without installing MongoDB, run `npm run demo` after `npm ci`; it uses an actual temporary MongoDB process, an ephemeral JWT secret, and port 5000. This development helper requires dev dependencies, network access for the first binary download and permission to launch local processes. It is not a production database, and data disappears when it stops.

## Environment

| Variable             | Meaning                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| `PORT`               | HTTP port; default `5000`                                                                      |
| `NODE_ENV`           | `development`, `test` or `production`                                                          |
| `MONGODB_URI`        | Required local MongoDB or Atlas URI                                                            |
| `JWT_SECRET`         | Required random secret, at least 32 characters; example placeholder is rejected                |
| `JWT_EXPIRES_IN`     | Token lifetime; default `7d`; `1h` or numeric seconds such as `3600`                           |
| `CORS_ORIGIN`        | Comma-separated explicit origins without trailing slash; default localhost/127.0.0.1 port 5173 |
| `BCRYPT_SALT_ROUNDS` | `10`–`15`; default `12`                                                                        |

`.env` loads relative to the backend directory even when invoked from the repository root. Environment variables take priority. Never commit `.env`. There is no baked-in production JWT secret.

## Endpoints

| Method | Endpoint                   | Authentication | Behavior                                             |
| ------ | -------------------------- | -------------- | ---------------------------------------------------- |
| POST   | `/api/auth/register`       | Public         | Register counselor; `201`, duplicate email `409`     |
| POST   | `/api/auth/login`          | Public         | Return JWT and employee; invalid credentials `401`   |
| GET    | `/api/auth/me`             | Bearer JWT     | Current employee, without password                   |
| POST   | `/api/enquiries`           | Public         | Submit enquiry; `201`, always unclaimed              |
| GET    | `/api/enquiries/public`    | Bearer JWT     | Only `claimedBy: null` enquiries                     |
| PATCH  | `/api/enquiries/:id/claim` | Bearer JWT     | Atomic claim by current employee                     |
| GET    | `/api/enquiries/my`        | Bearer JWT     | Only current employee's enquiries                    |
| GET    | `/api/health`              | Public         | `200` when MongoDB connected, `503` when unavailable |

All paths are relative to `http://localhost:5000`. JSON request bodies use `Content-Type: application/json`. Login returns `data.token`; protected routes require `Authorization: Bearer <token>`. Registration returns the employee; log in afterward to obtain a token.

Registration:

```json
{
  "name": "Alice Counselor",
  "email": "alice@example.com",
  "password": "StrongPassword123!"
}
```

Login:

```json
{ "email": "alice@example.com", "password": "StrongPassword123!" }
```

Public enquiry:

```json
{
  "name": "Prospective Client",
  "email": "client@example.com",
  "phone": "+91 9876543210",
  "courseInterest": "Full Stack Development",
  "message": "Please share course details."
}
```

Only `name`, `email` and `courseInterest` are required for enquiries. Claim requests have no body (or `{}`). The API rejects unsupported body fields, including `claimedBy`; claiming identity always comes from a verified JWT. Names/course text are trimmed, emails normalized to lowercase. Passwords are not trimmed or normalized; minimum 8 characters, maximum 72 UTF-8 bytes to avoid bcrypt truncation. Name limits: 2–100 characters; course: 2–120; optional message: up to 2000. Optional phone: 7–25 characters, digits with common phone punctuation.

Examples below use curl; on Windows PowerShell use `curl.exe` and a JSON body file if your shell alters JSON quoting:

```sh
curl http://localhost:5000/api/health
curl -X POST http://localhost:5000/api/auth/register -H 'Content-Type: application/json' -d '{"name":"Alice Counselor","email":"alice@example.com","password":"StrongPassword123!"}'
curl -X POST http://localhost:5000/api/auth/login -H 'Content-Type: application/json' -d '{"email":"alice@example.com","password":"StrongPassword123!"}'
curl -X POST http://localhost:5000/api/enquiries -H 'Content-Type: application/json' -d '{"name":"Client Name","email":"client@example.com","courseInterest":"React"}'
curl 'http://localhost:5000/api/enquiries/public?page=1&limit=20' -H 'Authorization: Bearer YOUR_TOKEN'
curl -X PATCH http://localhost:5000/api/enquiries/ENQUIRY_ID/claim -H 'Authorization: Bearer YOUR_TOKEN'
curl http://localhost:5000/api/enquiries/my -H 'Authorization: Bearer YOUR_TOKEN'
```

Listings accept only `page` and `limit`, defaulting to `page=1&limit=20`; limit is capped at 100, page at 1,000,000. Unsupported, repeated or operator-style query parameters return `400`. Results sort newest-first by creation time then ID. Pagination is offset based; concurrent changes between pages can change results/counts.

Successful list:

```json
{
  "success": true,
  "data": { "enquiries": [] },
  "pagination": { "page": 1, "limit": 20, "total": 0, "pages": 0 }
}
```

Error:

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": [{ "field": "email", "message": "Enter a valid email address." }],
  "requestId": "generated-request-id"
}
```

Claim statuses: `200` successful, `400` invalid ObjectId/body, `401` missing/invalid JWT, `404` absent enquiry, `409` already claimed (including a repeated claim by its owner), `500` unexpected failure. Conflicts reveal no enquiry payload or owner. No generic enquiry-read, reassign or update endpoint is exposed.

## Atomicity and privacy

`claimEnquiry` executes a single `findOneAndUpdate({ _id, claimedBy: null }, { $set: { claimedBy: req.employee._id } }, { returnDocument: 'after' })`. There is no read-before-write or unconditional update. A failed update is followed only by an existence check to distinguish `404` from `409`. MongoDB's atomic single-document conditional write allows exactly one counselor to win. Public and private listings use server-owned filters; client-supplied query filters never change ownership scope. The compound ownership/time/ID index supports both listing queries. See [MongoDB single-document atomicity](https://www.mongodb.com/docs/manual/core/write-operations-atomicity/) and [Mongoose atomic findOneAndUpdate](https://mongoosejs.com/docs/tutorials/findoneandupdate.html).

JWT verification restricts algorithm, issuer and audience and confirms the employee still exists. Passwords are hashed by a model save hook, excluded from normal queries and explicitly omitted from responses. Duplicate email races are handled by MongoDB's unique index. JSON bodies are limited to 32 KB; unknown fields/operator payloads are rejected. Text is stored as plain text, not interpreted as HTML. CORS controls browser origins, not API authentication; non-browser requests without an Origin header are allowed. Helmet applies security headers. JSON request logs include method/path/status/duration/request ID, never body, password, authorization header or token. Central errors do not return stack traces or raw database errors. Express 5 forwards rejected async handlers to the central error handler.

## Tests and project layout

```sh
npm run check
npm test
```

Tests use Supertest and MongoDB 7.0.24 launched by `mongodb-memory-server`. First run downloads the binary to ignored `.cache/mongodb`; all data is isolated from your configured database. Coverage includes hashing, duplicate registration races, JWT failures, operator/mass-assignment rejection, privacy, pagination, invalid/not-found/conflict claims, five concurrent claim races, health/CORS/security headers, malformed/oversized JSON, and sanitized unexpected errors. `npm run check` checks JavaScript syntax without needing a database or secrets.

`src/config` holds environment/database setup; `models` hold schemas; `middleware` holds auth, validation, logging and errors; `controllers` hold business logic; `routes` wire endpoints; `utils` hold token/error/response helpers. `src/app.js` exports the Express app without opening a port; `server.js` connects the database, initializes indexes, starts listening, and handles graceful shutdown. The existing frontend remains independent.
