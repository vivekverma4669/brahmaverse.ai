# ReactJS and Node.js Developer Assignment

This document presents the assignment requirements, React implementation, CRM REST API endpoints and instructions for running and reviewing the projects.

## 1. Assignment overview

| Item | Details |
| --- | --- |
| ReactJS assignment | Implement the supplied mobile app design |
| Design reference | [Mobile App Design Task on Figma](https://www.figma.com/design/3ojakpt78j8wWhqW1yQMnT/Mobile-App-Design-Task?node-id=0-1&t=r9aMQajqdngWZI8z-1) |
| Node.js assignment | Final round: design a customer relationship management (CRM) backend |
| Backend time allotted | 2 hours |
| Submission | [Assignment submission form](https://forms.gle/QuwjEmPHQVZNsToq6) |
| Deadline from the original brief | Submit the assignment by 5 PM tomorrow. (14th October) |

### CRM business logic

1. Each employee/counselor has a CRM account associated with their email address.
2. Prospective clients submit an enquiry form containing their name, email, course interest and other basic details. The form can be circulated online or shared by a counselor after a call with a student.
3. All employees/counselors can view unclaimed enquiries. These are public enquiries within the CRM.
4. A counselor can claim a public enquiry. It becomes private, belongs exclusively to that counselor and is no longer visible to other employees.

### Required technology and acceptance criteria

The backend assignment requires only REST APIs, coded in Node.js using Express and JWT tokens. PostgreSQL, MySQL or MongoDB must be used; this implementation uses MongoDB. Additional libraries are permitted.

| Required capability | Implemented API |
| --- | --- |
| Employee registration | `POST /api/auth/register` |
| Employee login | `POST /api/auth/login` |
| Public enquiry form without authentication | `POST /api/enquiries` |
| Claim leads | `PATCH /api/enquiries/:id/claim` |
| Fetch unclaimed leads | `GET /api/enquiries/public` |
| Fetch leads claimed by the logged-in employee | `GET /api/enquiries/my` |

## 2. Project structure and technology

```text
frontend/   React mobile food application
backend/    Node.js CRM REST API
README.md   Assignment and implementation documentation
```

| Project | Technology |
| --- | --- |
| React application | React, JavaScript, Vite, React Router, CSS, Lucide icons |
| Backend | Node.js, Express 5, MongoDB, Mongoose |
| Authentication | JWT and bcryptjs password hashing |
| API validation and middleware | express-validator, CORS, Helmet, request logging and centralized error handling |

Both applications run independently with separate dependency manifests. The React food app uses local demo data and does not call the CRM API.

## 3. ReactJS implementation

### Design and features

The Fastor mobile food application implements phone sign-up, OTP verification, food home and food details. It follows the supplied `figmapic.png` screenshot because the original Figma design was inaccessible during implementation. Local reference imagery is stored in `frontend/public/assets/figma-reference.png`.

Features include country and phone selection, numeric keypads, OTP paste support, a resend countdown, bestseller and popular food lists, promotional offers, portion selection, quantity controls and a cart. Cart totals use the selected portion price and quantity. Cart quantities can be changed, and items are removed when their quantity reaches zero.

### React page routes

Development base URL: **http://127.0.0.1:5173**.

These are browser routes. The React application has no HTTP API endpoints: phone verification, food data, cart and demo orders are handled locally.

| Route | Screen | Access | Purpose |
| --- | --- | --- | --- |
| `/` | Phone sign-up | Public | Select a country, enter and validate a phone number |
| `/verify` | OTP verification | Public route | Enter the six-digit OTP and resend after the countdown |
| `/home` | Food home | Local demo authentication required | Browse food, offers, location dialog, cart and demo order actions |
| `/food/:id` | Food details | Local demo authentication required | Select portions and quantity, then add to cart; example: `/food/pizza` |
| Any unmatched route | Redirect | Public | Redirect to `/` |

### Demo walkthrough

1. Open `/` and enter a valid phone number for the selected country.
2. Continue to `/verify` and enter **123456**.
3. Browse `/home`, select a food item and choose its portion and quantity.
4. Add it to the cart and open the bag to review or change quantities.

Resend is available after 30 seconds. Authentication, selections and cart persist in `sessionStorage` under `fastor-v2`. No SMS is sent. Cancel Order and Track Driver operate on local demo orders; payments, live location and real driver tracking are not connected.

### Run and build

Requires **Node.js 20.19+** and npm.

```sh
cd frontend
npm ci
npm run dev
```

Open **http://127.0.0.1:5173**. To build and preview:

```sh
npm run build
npm run preview
```

Production assets are generated in `frontend/dist`. Hosting requires an SPA fallback to `index.html` for browser routes.

## 4. Node.js CRM REST API

### Authentication and ownership

Employees register with their name, email and password, then log in to obtain a JWT. Passwords are hashed with bcrypt and excluded from employee responses. Protected endpoints use the employee identity from the verified token.

Public form submissions start with `claimedBy: null`. Claiming uses an atomic conditional MongoDB update so that only one counselor can claim an enquiry when requests arrive concurrently. After claiming, the enquiry is excluded from public listings and appears only in its owner's claimed-lead list.

### API endpoints

Server base URL: **http://localhost:5000**. API prefix: **`/api`**.

Send JSON bodies with `Content-Type: application/json`. Protected requests require `Authorization: Bearer <token>`.

| Method | Endpoint | Authentication | Request | Successful response |
| --- | --- | --- | --- | --- |
| `POST` | `/api/auth/register` | None | `name`, `email`, `password` | `201`: employee account |
| `POST` | `/api/auth/login` | None | `email`, `password` | `200`: JWT and employee |
| `GET` | `/api/auth/me` | Bearer JWT | No body | `200`: logged-in employee |
| `POST` | `/api/enquiries` | None | `name`, `email`, `courseInterest`; optional `phone`, `message` | `201`: unclaimed enquiry |
| `GET` | `/api/enquiries/public` | Bearer JWT | Optional `page`, `limit` query parameters | `200`: paginated unclaimed enquiries |
| `PATCH` | `/api/enquiries/:id/claim` | Bearer JWT | Enquiry MongoDB ObjectId in path; no body or `{}` | `200`: enquiry assigned to logged-in employee |
| `GET` | `/api/enquiries/my` | Bearer JWT | Optional `page`, `limit` query parameters | `200`: paginated enquiries owned by logged-in employee |
| `GET` | `/api/health` | None | No body | `200`: database connected; `503` when unavailable |

Public enquiries are visible to all authenticated employees. The enquiry submission endpoint is accessible without authentication.

### Employee registration

**`POST /api/auth/register`**

```json
{
  "name": "Alice Counselor",
  "email": "alice@example.com",
  "password": "StrongPassword123!"
}
```

Returns `data.employee`. Registration does not issue a JWT; log in afterward. Duplicate emails return `409`.

### Employee login

**`POST /api/auth/login`**

```json
{
  "email": "alice@example.com",
  "password": "StrongPassword123!"
}
```

Returns `data.token` and `data.employee`. Invalid credentials return `401`. Use the returned token for protected requests:

```http
Authorization: Bearer <token>
```

### Public enquiry submission

**`POST /api/enquiries`**

```json
{
  "name": "Prospective Client",
  "email": "client@example.com",
  "courseInterest": "Full Stack Development",
  "phone": "+91 9876543210",
  "message": "Please share course details."
}
```

Only `name`, `email` and `courseInterest` are required. Returns `data.enquiry`. Ownership is assigned by the server; fields such as `claimedBy` are rejected in the request body.

### Lead listing and claiming workflow

1. Log in and copy `data.token`.
2. Call `GET /api/enquiries/public?page=1&limit=20` with the bearer token.
3. Copy an enquiry's `_id` and call `PATCH /api/enquiries/<enquiry-id>/claim` with the token and no body.
4. Call `GET /api/enquiries/my?page=1&limit=20` to retrieve the employee's private enquiries.
5. Use `GET /api/auth/me` to retrieve the logged-in employee's profile.

Both lists default to `page=1` and `limit=20`, allow a maximum limit of 100 and sort newest first. Only `page` and `limit` query parameters are accepted.

Example list response:

```json
{
  "success": true,
  "data": { "enquiries": [] },
  "pagination": { "page": 1, "limit": 20, "total": 0, "pages": 0 }
}
```

Successful claim responses contain `success`, `message` and `data.enquiry`. An already-claimed enquiry returns `409`, including a repeated claim by its owner. Claim conflicts expose neither the private enquiry nor its owner.

### Validation and error responses

Names require 2-100 characters, course interest 2-120 characters and optional messages at most 2,000 characters. Emails are normalized to lowercase. Registration passwords require at least 8 characters and must not exceed 72 UTF-8 bytes. Unsupported body fields are rejected.

| Status | Meaning |
| --- | --- |
| `400` | Invalid input, unsupported fields/query parameters or invalid enquiry ID |
| `401` | Invalid credentials or missing, invalid or expired JWT |
| `403` | Browser origin rejected by CORS configuration |
| `404` | Enquiry or route not found |
| `409` | Duplicate email or enquiry already claimed |
| `500` | Unexpected server error |
| `503` | Database unavailable on the health endpoint |

Example validation error:

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": [{ "field": "email", "message": "Enter a valid email address." }],
  "requestId": "generated-request-id"
}
```

### Backend setup

```sh
cd backend
npm ci
```

Copy `.env.example` to `.env` inside `backend`. Use `Copy-Item .env.example .env` in PowerShell or `cp .env.example .env` on macOS/Linux. Configure MongoDB and replace the JWT placeholder with a random secret.

| Variable | Purpose | Default or requirement |
| --- | --- | --- |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Runtime environment | `development`, `test` or `production` |
| `MONGODB_URI` | Database connection | Required local MongoDB or Atlas URI |
| `JWT_SECRET` | Token signing secret | Required random secret of at least 32 characters |
| `JWT_EXPIRES_IN` | Token lifetime | `7d` |
| `CORS_ORIGIN` | Comma-separated allowed browser origins | Localhost and 127.0.0.1 on port 5173 |
| `BCRYPT_SALT_ROUNDS` | Password hashing cost | `12`; allowed range 10-15 |

Generate a secret, put it in `.env`, then start the API:

```sh
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
npm run dev
```

Use `npm start` to run without watch mode. MongoDB must be available before startup. Check **http://localhost:5000/api/health**.

For a disposable local demo, use `npm run demo` instead. It downloads and launches a real temporary MongoDB process and generates a temporary JWT secret. Demo data disappears when the process stops. Normal startup uses the database configured in `.env`.

## 5. Verification

Run each command from its application directory:

| Project | Command | Purpose |
| --- | --- | --- |
| React | `npm test` | Frontend unit tests |
| React | `npm run test:e2e` | Browser flows and responsive layout checks using Playwright and Microsoft Edge |
| React | `npm run build` | Production build |
| Backend | `npm run check` | JavaScript syntax checks |
| Backend | `npm test` | API integration tests using Supertest and isolated MongoDB |

Frontend browser tests cover authentication, keypads, resend, portions, cart persistence and home interactions. Backend tests cover registration/login, validation, JWT authentication, privacy, pagination and concurrent claims. The integration-test database is separate from the configured application database; the first run downloads the MongoDB binary.

## 6. Supporting documentation and submission

- [React application details](frontend/README.md)
- [Backend API details and curl examples](backend/README.md)
- [Assignment submission form](https://forms.gle/QuwjEmPHQVZNsToq6)

The original assignment specifies submission by **5 PM on 14th October**.
