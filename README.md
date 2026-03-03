# 📧 ReachInbox – Full-Stack Email Job Scheduler

> A production-grade email scheduling service built with **Express.js**, **BullMQ**, **Redis**, **PostgreSQL**, and a **Next.js** dashboard. Designed to reliably schedule and send emails at scale — surviving server restarts, enforcing rate limits, and preventing duplicate sends.

🔗 **Live Backend:** [https://software-development-intern-assignment.onrender.com](https://software-development-intern-assignment.onrender.com)

WATCH DEMO OF THE PROJECT : (https://drive.google.com/file/d/1NDqhKqIoGj2J2h_KVStpOUxmFkNDuTaB/view)

---

## 📑 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Features Implemented](#features-implemented)
- [Getting Started — Backend](#getting-started--backend)
- [Getting Started — Frontend](#getting-started--frontend)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [How Scheduling Works](#how-scheduling-works)
- [Persistence on Restart](#persistence-on-restart)
- [Rate Limiting & Concurrency](#rate-limiting--concurrency)
- [Behavior Under Load](#behavior-under-load)
- [BullMQ Dashboard](#bullmq-dashboard)
- [Database Schema](#database-schema)
- [Assumptions & Trade-offs](#assumptions--trade-offs)

---
## Images of Live Local Running 
<img width="1411" height="200" alt="image" src="https://github.com/user-attachments/assets/ea2d5d40-4618-4240-8da6-fbb9c2342019" />
<img width="1220" height="200" alt="image" src="https://github.com/user-attachments/assets/82510cb6-0104-411d-875b-2d75523d7cba" />
<img width="669" height="346" alt="image" src="https://github.com/user-attachments/assets/331ed731-073b-47bf-9ab6-c7494be8bcca" />
<img width="1896" height="888" alt="image" src="https://github.com/user-attachments/assets/f2170a2a-61c6-4d13-bcc7-2b62084819c8" />
<img width="1899" height="867" alt="image" src="https://github.com/user-attachments/assets/476ef4f6-3759-4f4f-91cb-9ad9627dd212" />
<img width="1425" height="831" alt="image" src="https://github.com/user-attachments/assets/fd43c43c-2863-473d-a364-6b15824a4458" />
<img width="1869" height="876" alt="image" src="https://github.com/user-attachments/assets/2e14bac3-6e65-4b95-90dd-9df889c44928" />
<img width="1399" height="794" alt="image" src="https://github.com/user-attachments/assets/188b8367-8ae8-4d7d-897b-04ed2701ebd5" />
<img width="937" height="559" alt="image" src="https://github.com/user-attachments/assets/30c41d1e-afad-4209-a3d6-133d1047b777" />
## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│               Next.js Frontend (Google OAuth)               │
│   Login → Dashboard → Compose → Scheduled / Sent Tables    │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP (Axios)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                        Express API                          │
│   POST /schedule-email   │   GET /emails   │  /admin/queues │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────┐       ┌──────────────────────┐
│     PostgreSQL (Prisma)  │◄─────►│   BullMQ Email Queue │
│  - Email records         │       │  - Delayed jobs       │
│  - Sender configs        │       │  - Job persistence    │
└──────────────────────────┘       └──────────┬───────────┘
                                              │
                                   ┌──────────▼───────────┐
                                   │   Redis               │
                                   │  - Job storage        │
                                   │  - Rate limit counters│
                                   └──────────┬───────────┘
                                              │
                                   ┌──────────▼───────────┐
                                   │   BullMQ Worker       │
                                   │  - Concurrency: 5     │
                                   │  - Rate limiter       │
                                   │  - Nodemailer/SMTP    │
                                   └──────────────────────┘
```

---

## Tech Stack

| Layer       | Technology                                    |
|-------------|-----------------------------------------------|
| Language    | TypeScript                                    |
| Framework   | Express.js (backend), Next.js App Router (frontend) |
| Queue       | BullMQ                                        |
| Cache/State | Redis (ioredis)                               |
| Database    | PostgreSQL via Prisma ORM                     |
| SMTP        | Ethereal Email (Nodemailer)                   |
| Auth        | NextAuth.js + Google OAuth                    |
| Queue UI    | Bull Board (`@bull-board/express`)            |
| Styling     | Tailwind CSS                                  |
| HTTP Client | Axios                                         |

---

## Features Implemented

### Backend — Scheduler
- [x] `POST /schedule-email` — accepts email scheduling requests
- [x] Stores emails in PostgreSQL via Prisma before queuing
- [x] Schedules using **BullMQ delayed jobs** (no cron)
- [x] Idempotent job creation using `jobId = email.id`
- [x] Jobs set with `removeOnComplete: false` and `removeOnFail: false` for durability
- [x] Automatic retry with **exponential backoff** (3 attempts, 5s base delay)

### Backend — Persistence
- [x] All scheduled emails stored in PostgreSQL with status tracking
- [x] BullMQ persists job state in Redis; jobs survive server restarts
- [x] Emails not re-sent on restart — idempotency enforced via DB status checks
- [x] Atomic DB transaction prevents double-processing (`PROCESSING` state lock)

### Backend — Rate Limiting
- [x] Per-sender hourly rate limiting via **atomic Lua script in Redis**
- [x] Rate limit key format: `rate:{senderId}:{YYYYMMDDHH}`
- [x] TTL set to remaining seconds in the current hour window
- [x] When limit exceeded: job is **rescheduled to next hour** (not dropped)
- [x] Configurable via `MAX_EMAILS_PER_HOUR_PER_SENDER` env variable

### Backend — Concurrency & Throttling
- [x] BullMQ worker concurrency configurable via `WORKER_CONCURRENCY` env variable (default: 5)
- [x] BullMQ `limiter` enforces **minimum delay between sends** (default: 2 seconds)
- [x] Multiple workers are safe — rate limiter is Redis-backed, not in-memory

### Backend — Multi-Sender Support
- [x] `Sender` model with individual SMTP credentials per sender
- [x] Dynamic Nodemailer transporter created per sender at send time

### Backend — Monitoring
- [x] Bull Board dashboard at `/admin/queues`

### Frontend — Auth
- [x] Real **Google OAuth login** via NextAuth.js
- [x] Session-based redirect — logged-in users go straight to dashboard
- [x] Header shows user **avatar** and **Sign Out** button
- [x] Sign out redirects back to `/login`

### Frontend — Dashboard
- [x] Sidebar with **Scheduled** and **Sent** tab navigation (via URL query params)
- [x] Header with search bar and user avatar
- [x] Email list table with **status badges**, subject, and body preview
- [x] **Pagination** (6 emails per page) with Prev / Next controls
- [x] **Empty state** when no emails are found
- [x] Click any email row to open **MailViewer** — full-screen detail panel

### Frontend — Compose
- [x] Recipient input as **email chips** (type + Enter or comma to add, × to remove)
- [x] **CSV / TXT file upload** — parsed with PapaParse, shows detected email count
- [x] Subject and body textarea fields
- [x] **Send Now** button — schedules immediately at current time
- [x] **Schedule Later** popover — datetime picker, confirm with Done
- [x] Delay between emails and hourly limit inputs (UI present)
- [x] Calls `POST /schedule-email` for each recipient in the list

### Frontend — Code Quality
- [x] TypeScript throughout with a shared `Email` interface for API responses
- [x] Reusable components: `EmailChipsInput`, `EmailTable`, `FileUpload`, `Header`, `Sidebar`, `MailViewer`, `Loader`
- [x] Centralized Axios instance (`lib/api.ts`) pointing to backend via env variable
- [x] Clean folder structure: `components/`, `types/`, `lib/`, `app/`

---

## Getting Started — Backend

### Prerequisites

- Node.js 18+
- PostgreSQL
- Redis
- Docker (optional, recommended)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Redis and PostgreSQL via Docker

```bash
# Redis on port 6380
docker run -d -p 6380:6379 --name redis-scheduler redis

# PostgreSQL on port 5432
docker run -d \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=scheduler \
  -p 5432:5432 \
  --name pg-scheduler \
  postgres
```

### 4. Set Up Environment Variables

Create a `.env` file in the backend root:

```env
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/scheduler
REDIS_URL=redis://127.0.0.1:6380

WORKER_CONCURRENCY=5
MIN_DELAY_MS=2000
MAX_EMAILS_PER_HOUR_PER_SENDER=200
```

### 5. Run Prisma Migrations

```bash
npx prisma migrate dev --name init
```

### 6. Set Up Ethereal Email

Go to [https://ethereal.email](https://ethereal.email) and create a free test account. You will receive:

- SMTP Host: `smtp.ethereal.email`
- SMTP Port: `587`
- SMTP Username & Password

Insert a sender record into the database. Using Prisma Studio:

```bash
npx prisma studio
```

Or via SQL:

```sql
INSERT INTO "Sender" (id, name, "smtpHost", "smtpPort", "smtpUser", "smtpPass", "createdAt")
VALUES (
  gen_random_uuid(),
  'Test Sender',
  'smtp.ethereal.email',
  587,
  'your_ethereal_username',
  'your_ethereal_password',
  NOW()
);
```

Copy the generated `id` — you will need it as the `senderId` when scheduling emails.

### 7. Build and Run

```bash
# Development (watch mode)
npm run dev

# Production
npm run build
npm start
```

The server starts on `http://localhost:4000`.

---

## Getting Started — Frontend

### Prerequisites

- Node.js 18+
- A Google Cloud project with OAuth 2.0 credentials

### 1. Navigate to the Frontend Directory

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Set application type to **Web application**
6. Add `http://localhost:3000` to **Authorized JavaScript origins**
7. Add `http://localhost:3000/api/auth/callback/google` to **Authorized redirect URIs**
8. Copy the **Client ID** and **Client Secret**

### 4. Set Up Environment Variables

Create a `.env.local` file in the frontend root:

```env
NEXT_PUBLIC_API_URL=https://software-development-intern-assignment.onrender.com

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

NEXTAUTH_SECRET=supersecret
NEXTAUTH_URL=http://localhost:3000
```

> To use a local backend instead, set `NEXT_PUBLIC_API_URL=http://localhost:4000`.

### 5. Run the Frontend

```bash
npm run dev
```

The app starts on `http://localhost:3000`. Navigate to `/login` to sign in with Google.

---

## Environment Variables

### Backend

| Variable                          | Default                                                   | Description                                     |
|-----------------------------------|-----------------------------------------------------------|-------------------------------------------------|
| `PORT`                            | `4000`                                                    | Express server port                             |
| `DATABASE_URL`                    | `postgresql://postgres:postgres@127.0.0.1:5432/scheduler` | PostgreSQL connection string                    |
| `REDIS_URL`                       | `redis://127.0.0.1:6380`                                  | Redis connection string                         |
| `WORKER_CONCURRENCY`              | `5`                                                       | Number of parallel BullMQ worker jobs           |
| `MIN_DELAY_MS`                    | `2000`                                                    | Minimum delay between email sends (ms)          |
| `MAX_EMAILS_PER_HOUR_PER_SENDER`  | `200`                                                     | Max emails sent per sender per hour             |

### Frontend

| Variable                  | Description                                                    |
|---------------------------|----------------------------------------------------------------|
| `NEXT_PUBLIC_API_URL`     | Base URL of the backend API                                    |
| `GOOGLE_CLIENT_ID`        | Google OAuth Client ID                                         |
| `GOOGLE_CLIENT_SECRET`    | Google OAuth Client Secret                                     |
| `NEXTAUTH_SECRET`         | Random secret for NextAuth session signing                     |
| `NEXTAUTH_URL`            | Public URL of the frontend (e.g. `http://localhost:3000`)      |

---

## API Reference

### `POST /schedule-email`

Schedule a new email to be sent at a specific time.

**Request Body:**

```json
{
  "to": "recipient@example.com",
  "subject": "Hello from ReachInbox",
  "body": "This is the email body.",
  "senderId": "<uuid-of-sender>",
  "scheduledAt": "2025-06-15T10:30:00.000Z"
}
```

**Response:** `200 OK` — the created email record.

```json
{
  "id": "uuid",
  "to": "recipient@example.com",
  "subject": "Hello from ReachInbox",
  "body": "...",
  "scheduledAt": "2025-06-15T10:30:00.000Z",
  "status": "SCHEDULED",
  "senderId": "uuid",
  "jobId": "uuid",
  "createdAt": "..."
}
```

---

### `GET /emails`

Retrieve all emails, optionally filtered by status.

**Query Parameters:**

| Param    | Type   | Values                                                   |
|----------|--------|----------------------------------------------------------|
| `status` | string | `PENDING`, `SCHEDULED`, `PROCESSING`, `SENT`, `FAILED`  |

**Examples:**

```
GET /emails
GET /emails?status=SCHEDULED
GET /emails?status=SENT
```

---

### `GET /admin/queues`

Bull Board UI — open in a browser to visualise the BullMQ job queue.

---

## How Scheduling Works

1. **Client calls `POST /schedule-email`** with a future `scheduledAt` timestamp.
2. The server **creates an email record** in PostgreSQL with status `SCHEDULED`.
3. A **BullMQ delayed job** is added to the `emailQueue` with:
   - `delay = scheduledAt - Date.now()` (milliseconds)
   - `jobId = email.id` (prevents duplicate jobs)
4. The **BullMQ worker** picks up the job once the delay expires.
5. The worker checks a **Redis-backed rate limiter** before sending.
6. If allowed, the worker uses **Nodemailer** with the sender's Ethereal SMTP credentials.
7. The email record is updated in PostgreSQL to `SENT` (or `FAILED` on error).

---

## Persistence on Restart

**The system survives server restarts without data loss or duplicate sends.**

- BullMQ stores all job state in **Redis**. Delayed jobs are not lost when the Node.js process stops — they remain in Redis and are picked up when the worker reconnects.
- Email records in **PostgreSQL** track the authoritative status of every email.
- On worker restart, jobs resume from their persisted Redis state. Jobs that were mid-flight (status `PROCESSING`) are detected via a DB transaction and skipped if already `SENT`.
- **Idempotency** is enforced at two levels:
  1. `jobId = email.id` — BullMQ deduplicates job creation.
  2. DB transaction on worker pickup — sets status to `PROCESSING` atomically, preventing concurrent workers from double-processing the same email.

---

## Rate Limiting & Concurrency

### Per-Sender Hourly Rate Limit

Rate limiting uses an **atomic Lua script executed in Redis**:

```
key = rate:{senderId}:{YYYYMMDDHH}
```

- On each send attempt the counter for the current hour window is atomically incremented.
- If the counter exceeds `MAX_EMAILS_PER_HOUR_PER_SENDER`, the send is denied.
- The Redis key TTL is set to the remaining seconds in the current hour — it auto-expires cleanly.
- When rate-limited, the job is **moved to a delayed state** until the next hour window via `job.moveToDelayed(msUntilNextHour())`. Jobs are **never dropped**.

### Minimum Delay Between Sends

BullMQ's built-in `limiter` is configured on the worker:

```
limiter: { max: 1, duration: MIN_DELAY_MS }  // default: 2000ms
```

This enforces a minimum of **2 seconds between individual email sends**, mimicking real-world provider throttling.

### Worker Concurrency

The worker runs with `concurrency: WORKER_CONCURRENCY` (default: 5), processing up to 5 jobs in parallel. Because rate limiting is Redis-backed and uses atomic operations, it remains correct across any number of concurrent workers or instances.

---

## Behavior Under Load

When 1000+ emails are scheduled for the same time window:

1. All jobs are held in the BullMQ Redis queue — nothing is dropped.
2. Workers process up to `WORKER_CONCURRENCY` jobs in parallel.
3. The BullMQ `limiter` throttles sends to at most 1 per `MIN_DELAY_MS` per worker slot.
4. The per-sender hourly cap is enforced atomically. Overflow jobs are automatically rescheduled to the next hour, preserving relative order within BullMQ's delay queue.
5. The system continues processing across multiple hours until all emails are delivered.

---

## BullMQ Dashboard

Visit `/admin/queues` on the backend server in your browser:

- View **waiting**, **delayed**, **active**, **completed**, and **failed** jobs
- Manually retry failed jobs
- Inspect job payloads and error traces

---

## Database Schema

```prisma
model Sender {
  id        String   @id @default(uuid())
  name      String
  smtpHost  String
  smtpPort  Int
  smtpUser  String
  smtpPass  String
  createdAt DateTime @default(now())
  emails    Email[]
}

model Email {
  id          String      @id @default(uuid())
  to          String
  subject     String
  body        String
  scheduledAt DateTime
  status      EmailStatus @default(PENDING)
  senderId    String
  sender      Sender      @relation(fields: [senderId], references: [id])
  jobId       String?     @unique
  externalId  String?     @unique  // Nodemailer messageId after send
  createdAt   DateTime    @default(now())
  sentAt      DateTime?
}

enum EmailStatus {
  PENDING
  SCHEDULED
  PROCESSING
  SENT
  FAILED
}
```

---

## Assumptions & Trade-offs

| Area | Decision | Reason |
|------|----------|--------|
| **No cron** | BullMQ delayed jobs only | Matches hard constraint; Redis persists jobs across restarts |
| **Idempotency** | `jobId = email.id` + DB status transaction | Prevents duplicate sends across restarts and concurrent workers |
| **Rate limit granularity** | Per-sender, per-hour | Mirrors real email provider throttling models |
| **Overflow strategy** | Reschedule to next hour window | Jobs are never dropped; order is best-effort within BullMQ's delay queue |
| **SMTP** | Ethereal Email (Nodemailer) | Fake SMTP for safe testing — swap host/credentials for production SMTP |
| **Auth boundary** | NextAuth.js on frontend only | Backend is treated as an internal service; auth is enforced at the frontend layer |
| **SenderId in compose** | Single UUID hardcoded in UI | Backend fully supports multiple senders; a sender selector dropdown is a straightforward next step |
| **Delay / hourly limit inputs** | UI fields present, not yet wired to per-request backend params | Backend enforces limits via env config; the inputs are groundwork for per-campaign configuration |
| **Bull Board auth** | No auth on `/admin/queues` | Development convenience — should be protected behind middleware in production |

