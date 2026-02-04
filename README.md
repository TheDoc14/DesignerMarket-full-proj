# Designer Market

Full-stack marketplace for industrial design students/designers to showcase and sell **digital design projects**, receive reviews, and manage secure purchases (PayPal Sandbox/Live-ready).

---

## Table of Contents
- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Key Features](#key-features)
- [Roles & Permissions](#roles--permissions)
- [Project Structure](#project-structure)
- [Getting Started (Local Setup)](#getting-started-local-setup)
- [Scripts](#scripts)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview-backend)
- [File Access & Security Model](#file-access--security-model)
- [Testing & Verification](#testing--verification-manual)
- [Roadmap (Planned)](#roadmap-planned)
- [Notes](#notes)

---

## Overview
**Designer Market is a MERN-style marketplace where:**
- Students/Designers upload projects (images + protected downloadable files)
- Admin approves Student/Designer accounts and publishes projects
- Customers purchase projects via PayPal
- After purchase, buyers gain access to protected project files (purchase-based access control)
- API follows consistent patterns (central error handler, validators, and `meta` for list endpoints)

**What makes this project “production-ready”:**
- Dynamic RBAC across the API (DB-driven roles + permissions)
- Hardened auth flows (rate limiting + validation + security headers)
- Safe serializers that prevent leaking sensitive fields
- Secure file access with explicit public vs protected routes
- Purchase-based access control (files unlock only after successful payment)

---

## Tech Stack

### Backend (Node/Express + MongoDB)
- **Node.js** (CommonJS)
- **Express 5**
- **MongoDB + Mongoose**
- **JWT Auth** `jsonwebtoken`
- **Password hashing**: `bcrypt`
- **Validation**: `express-validator`
- **Security**: `helmet`, `express-rate-limit`, `cors`, `mongo sanitize` (keys hardening)
- **File uploads**: `multer`
- **Email**: `nodemailer`
- **Environment**: `dotenv`
- **Utilities**: `crypto`, `path`

### Tooling / Code Quality
- **Nodemon** (dev server)
- **cross-env** (NODE_ENV scripts)
- **ESLint** + **Prettier** (lint/format)

### Frontend (React)
- React SPA (`front-end/`)
- React Router
- Context API
- Formik (forms)
- Styled/custom CSS (project UI)

---

## Key Features
### Implemented:
#### API Conventions (Consistency)
- JSON responses include `message` consistently
- List endpoints return `meta` (pagination) + data arrays
- Central validation layer (request validation before DB)
- Central error handler for consistent error responses
- Reusable query helpers for pagination/sorting

#### Auth & Security
- Register / Login
- Email verification + resend verification
- Forgot password + reset password
- JWT-based auth + RBAC permissions
- Rate limiting on auth flows
- Helmet security headers + CORS handling
- Google reCAPTCHA V3 protection on auth endpoints (`register`, `login`, `forgot-password`, `reset-password`, `resend-verification`)

#### Users / Profile
- Get/update my profile
- My projects “wall” with **pagination + sorting + meta**
- Get other user profile, his projects with **pagination + sorting + meta**

#### Projects
- Create/update/delete projects (authorized roles)
- Visibility rules:
  - Public viewers see **published** projects only
  - Owner/Admin see additional content
- Listing supports filtering + pagination + sorting + meta
- Safe serializers to prevent leaking sensitive fields

#### Reviews
- CRUD reviews
- Project rating stats recalculation
- Admin management endpoints

#### Files API (secure)
- Public: project images + profile images
- Protected:
  - project files (downloadables) – owner/admin/buyer-after-purchase
  - approval documents – permission-based (admin only by default)
- Defense-in-depth: route-level RBAC + controller checks

#### Admin Panel
- User approval management (student/designer verification workflow)
- Project publishing management
- Reviews management
- Admin stats endpoint
- Dynamic roles management (CRUD) + assign role to user

#### System Manager Panel (Read-Only)
- System statistics endpoints (read-only dashboards)
- Finance/revenue summary endpoints (read-only)

#### Orders / Purchases (PayPal)
- Create PayPal order → returns approve link
- Capture payment → persists order status in DB
- Seller payout handling
- Purchase-based access control: **buyers unlock protected project files**
- Hardening:
  - Prevent double capture / idempotency guard
  - Prevent self-purchase
  - Prevent duplicate pending orders

---

## Dynamic RBAC (Roles & Permissions)

This project implements **real dynamic RBAC**:
- `User.role` stores a **role key** (string), e.g. `admin`, `systemManager`, `student`, `designer`,    `customer`, or any custom role created later.
- `Role` documents in MongoDB store:
  - `key` (role identifier)
  - `permissions[]` (array of permission strings)
  - `isSystem` (system roles cannot be deleted)
- Authorization is enforced using middleware (permission checks), not hardcoded role checks.

### Default system roles (typical)
- `admin` – admin panel access (approvals, publishing, roles management)
- `systemManager` – read-only system panel (stats/finance)
- `student`, `designer`, `customer`

### Role management (Admin)
Roles can be created/updated/deleted **without code changes** using admin endpoints:
- `GET /api/admin/roles`
- `POST /api/admin/roles`
- `PUT /api/admin/roles/:key`
- `DELETE /api/admin/roles/:key`
- `PUT /api/admin/users/:id/role` (assign role key to user)

---

## Project Structure
```text
DesignerMarket-full-proj/
├─ front-end/        # React app
├─ back-end/         # Node/Express API
├─ README.md
└─ .gitignore
```
---

## Getting Started (Local Setup)

### 1) Clone and install
```bash
git clone https://github.com/TheDoc14/DesignerMarket-full-proj.git
cd DesignerMarket-full-proj
```
### 2) Backend setup
```bash
cd back-end
npm install
cp .env.example .env
npm run dev
```
### 3) Frontend setup
```bash
cd ../front-end
npm install
npm start
```

### Scripts
- **Backend (back-end/)**:
```bash
npm run dev          # nodemon (development)
npm start            # production start
npm run lint         # eslint
npm run lint:fix     # eslint --fix
npm run format       # prettier --write
npm run format:check # prettier --check
```
## NOTE:
- Backend runs on: http://localhost:5000
- Frontend runs on: http://localhost:3000

---

## Environment Variables
**What is `.env?`**
`.env` contains real secrets (DB URI, JWT secret, SMTP password, PayPal credentials).
Never commit .env to GitHub.

**What is `.env.example`?**
`.env.example` is a safe template of required variables (no secrets).
 Yes — `.env.example` should be committed to GitHub.

**Where is it stored?**
`back-end/.env.example`

(optional) front-end/.env.example if the frontend uses environment variables

**What should it contain? (example)**
```env
# Server
PORT=5000
PUBLIC_BASE_URL=http://localhost:5000
TRUST_PROXY=true
NODE_ENV=development


# MongoDB
DB_URI=replace_me

# JWT
JWT_SECRET=replace_me

# Email (SMTP) – לשליחת מייל אימות
SMTP_HOST=replace_me
SMTP_PORT=587
SMTP_SECURE=false          # true אם משתמשים ב־SMTPS (SSL/TLS) על פורט 465
SMTP_USER=replace_me   # שם משתמש בחשבון ה־SMTP
SMTP_PASS=replace_me   # סיסמת ה־SMTP
SMTP_FROM=replace_me

# Front-end URL – לשימוש בקישור אימות
CLIENT_URL=http://localhost:3000

# Reset token time
RESET_TOKEN_TTL_MIN=30

# PayPal
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=replace_me
PAYPAL_CLIENT_SECRET=replace_me
PAYPAL_CURRENCY=ILS

# Platform fee (optional)
PLATFORM_FEE_PERCENT=10

# Frontend URLs (לחזרה אחרי תשלום)
FRONTEND_BASE_URL=http://localhost:3000

# (אופציונלי אבל מומלץ בהמשך)
PAYPAL_WEBHOOK_ID=

# Google reCAPTCHA v3
RECAPTCHA_SITE_KEY=replace_me
RECAPTCHA_SECRET_KEY=replace_me
RECAPTCHA_MIN_SCORE=0.5
RECAPTCHA_ENABLED=true
RECAPTCHA_HOSTNAME=localhost

```
---

## API Overview (Backend)
- Base URL: `/api`

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/verify-email`
- `POST /auth/resend-verification`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`

### Profile
- `GET /profile/me` (includes paginated projects + meta)
- `PUT /profile/me`
- `GET /profile/:id` (includes paginated projects + meta)

### Projects
- `GET /projects` (filtering + pagination + meta)
- `GET /projects/:id`
- `POST /projects`
- `PUT /projects/:id`
- `DELETE /projects/:id`

### Reviews
- `GET /reviews` (pagination + meta)
- `POST /reviews`
- `PUT /reviews/:id`
- `DELETE /reviews/:id`

### Files
- Public:
  - `GET /files/profileImages/:file`
  - `GET /files/projectImages/:file`
- Protected:
  - `GET /files/projectFiles/:file` (owner/admin/purchased)
  - `GET /files/approvalDocuments/:file` (permission-based, admin by default)

### Admin
- Users:
  - `GET /admin/users` (admin-only)
  - `PUT /admin/users/:id/approval` (admin-only)
  - `PUT /admin/users/:id/role` (admin-only, dynamic RBAC)
- Roles:
  - `GET /admin/roles` (admin-only)
  - `POST /admin/roles` (admin-only)
  - `PUT /admin/roles/:key` (admin-only)
  - `DELETE /admin/roles/:key` (admin-only)
- Projects:
  - `GET /admin/projects` (admin-only)
  - `PUT /admin/projects/:id/publish` (admin-only)
- Reviews:
  - `GET /admin/reviews` (admin-only)
  - `GET /admin/stats` (admin-only)

### System (Read-only)
- `GET /system/stats` (system-manager)
- `GET /system/finance` (system-manager)

### Orders (PayPal)
- `POST /orders/paypal/create`
- `POST /orders/paypal/capture`
- `GET /orders/paypal/return`
- `GET /orders/paypal/cancel`

---

## File Access & Security Model
- Public endpoints never expose sensitive project files by default.
- Project serializer exposes `files` only when:
  - viewer is owner/admin, or
  - viewer is a buyer who completed purchase
- Purchase verification is based on Orders stored in MongoDB.

---

## Testing & Verification (Manual)
- Core flows tested manually with Postman and verified via MongoDB Compass:

### Auth
- Register, email verification, resend verification
- Login
- Forgot password / reset password
- Rate-limiting behavior for auth endpoints
- reCAPTCHA v3 verification tested (valid token via local HTML helper + invalid/missing token cases)

### RBAC / Permissions
- Admin-only endpoints guarded correctly
- System Manager endpoints guarded correctly
- Protected file endpoints enforce correct access rules

### Projects
- Create/update/delete
- Visibility and published-only public listing
- Filtering/pagination/sorting responses include consistent meta

### Reviews
- Create/update/delete
- Project rating/stats recalculation

### Orders / PayPal
- Create → approve (Sandbox) → capture
- DB persistence: order status updates and related project updates
- Hardening verified:
  - Capture with different buyer JWT denied
  - Duplicate capture blocked
  - Purchase of unpublished project blocked
  - Self-purchase blocked
  - Duplicate pending orders prevented

### Purchase-based file access
- Before purchase: protected files are hidden/blocked
- After purchase: buyer gains access to protected project files

---

## Roadmap (Planned)

### Phase 2: Public Profile + Wall -- DONE!!
- Public user profile endpoint
- Public projects wall (published only) with pagination/filtering/meta

### Phase 3: CAPTCHA -- DONE!!
- CAPTCHA on register/login/forgot/reset flows (MVP)
- Used Google reCAPTCHA v3 on register/login/forgot/reset/resend verification

### Phase 4: AI Endpoint
- MVP mock endpoint first
- Real AI integration with limits/logging

### Phase 5: Documentation & Automated Tests
- Swagger/OpenAPI docs
- Jest/Supertest test suite

### Optional Enhancements:
- Favorites/Wishlist
- Notifications
- Buyer↔Seller messaging
- Analytics (views/clicks)
- Optional 2FA
- Audit logs + extended admin analytics

---

## Notes
- Never commit `.env` or uploaded files. Commit `.env.example` and use `.gitignore`.
- Keep API responses consistent: `message` always included, `meta` for list endpoints.
---


