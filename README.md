# 📧 ReachInbox – Full-Stack Email Job Scheduler (Backend)

> A production-grade email scheduling service built with **Express.js**, **BullMQ**, **Redis**, and **PostgreSQL**. Designed to reliably schedule and send emails at scale — surviving server restarts, enforcing rate limits, and preventing duplicate sends.

🔗 **Live Backend:** [https://software-development-intern-assignment.onrender.com](https://software-development-intern-assignment.onrender.com)

---

## 📑 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Features Implemented](#features-implemented)
- [Getting Started](#getting-started)
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

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Express API                          │
│   POST /schedule-email   │   GET /emails   │   /admin/queues│
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

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Language    | TypeScript                          |
| Framework   | Express.js                          |
| Queue       | BullMQ                              |
| Cache/State | Redis (ioredis)                     |
| Database    | PostgreSQL via Prisma ORM           |
| SMTP        | Ethereal Email (Nodemailer)         |
| Queue UI    | Bull Board (`@bull-board/express`)  |

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

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- Redis
- Docker (optional, recommended for Redis & Postgres)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Redis and PostgreSQL (via Docker)

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

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

### 5. Run Prisma Migrations

```bash
npx prisma migrate dev --name init
```

### 6. Set Up Ethereal Email

Go to [https://ethereal.email](https://ethereal.email) and create a free test account. You will get:

- SMTP Host: `smtp.ethereal.email`
- SMTP Port: `587`
- SMTP Username & Password

Insert a sender record into the database using these credentials:

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

Or use Prisma Studio:

```bash
npx prisma studio
```

### 7. Build and Run

```bash
# Development (with ts-node/tsx)
npm run dev

# Production build
npm run build
npm start
```

The server starts on `http://localhost:4000`.

---

## Environment Variables

| Variable                        | Default                                              | Description                                     |
|---------------------------------|------------------------------------------------------|-------------------------------------------------|
| `PORT`                          | `4000`                                               | Express server port                             |
| `DATABASE_URL`                  | `postgresql://postgres:postgres@127.0.0.1:5432/scheduler` | PostgreSQL connection string               |
| `REDIS_URL`                     | `redis://127.0.0.1:6380`                             | Redis connection string                         |
| `WORKER_CONCURRENCY`            | `5`                                                  | Number of parallel BullMQ worker jobs           |
| `MIN_DELAY_MS`                  | `2000`                                               | Minimum delay between email sends (ms)          |
| `MAX_EMAILS_PER_HOUR_PER_SENDER`| `200`                                                | Max emails sent per sender per hour             |

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

| Param    | Type   | Values                                         |
|----------|--------|------------------------------------------------|
| `status` | string | `PENDING`, `SCHEDULED`, `PROCESSING`, `SENT`, `FAILED` |

**Examples:**

```
GET /emails
GET /emails?status=SCHEDULED
GET /emails?status=SENT
```

---

### `GET /admin/queues`

Bull Board UI — visualise the BullMQ job queue in the browser.

---

## How Scheduling Works

1. **Client calls `POST /schedule-email`** with a future `scheduledAt` timestamp.
2. The server **creates an email record** in PostgreSQL with status `SCHEDULED`.
3. A **BullMQ delayed job** is added to the `emailQueue` with:
   - `delay = scheduledAt - Date.now()` (milliseconds)
   - `jobId = email.id` (prevents duplicate jobs)
4. The **BullMQ worker** picks up the job when the delay expires.
5. The worker checks a **Redis-backed rate limiter** before sending.
6. If allowed, the worker uses **Nodemailer** with the sender's SMTP credentials to send the email.
7. The email record is updated in PostgreSQL to `SENT` (or `FAILED`).

---

## Persistence on Restart

**The system survives server restarts without data loss or duplicate sends.**

- BullMQ stores all job state in **Redis**. Delayed jobs are not lost when the Node.js process stops — they remain in Redis and are picked up when the worker reconnects.
- Email records in **PostgreSQL** track the authoritative status of every email.
- On worker restart, jobs resume from their persisted Redis state. Jobs that were mid-flight (status `PROCESSING`) are detected via a DB transaction and skipped if already `SENT`.
- **Idempotency** is enforced at two levels:
  1. `jobId = email.id` — BullMQ deduplicates job creation.
  2. DB transaction on worker pickup — sets status to `PROCESSING` atomically, so concurrent workers cannot double-process the same email.

---

## Rate Limiting & Concurrency

### Per-Sender Hourly Rate Limit

Rate limiting is implemented using an **atomic Lua script executed in Redis**:

```
key = rate:{senderId}:{YYYYMMDDHH}
```

- On each send attempt, the counter for the current hour window is atomically incremented.
- If the counter exceeds `MAX_EMAILS_PER_HOUR_PER_SENDER`, the send is denied.
- The Redis key TTL is set to the remaining seconds in the current hour, so it auto-expires cleanly.
- When rate-limited, the job is **moved to a delayed state** until the start of the next hour window using `job.moveToDelayed(msUntilNextHour())` — jobs are **never dropped**.

### Minimum Delay Between Sends

BullMQ's built-in `limiter` is configured on the worker:

```
limiter: { max: 1, duration: MIN_DELAY_MS }  // default: 2000ms
```

This enforces a minimum of **2 seconds between individual email sends**, mimicking real-world provider throttling.

### Worker Concurrency

The worker is configured with `concurrency: WORKER_CONCURRENCY` (default: 5), meaning up to 5 jobs can be processed in parallel. The Redis-based rate limiter is safe across concurrent workers — it uses atomic Redis operations, not in-memory counters.

---

## Behavior Under Load

When 1000+ emails are scheduled for the same time window:

1. The BullMQ queue holds all jobs in Redis — no emails are dropped.
2. Workers process up to `WORKER_CONCURRENCY` jobs in parallel.
3. The BullMQ `limiter` throttles sends to at most 1 per `MIN_DELAY_MS` per worker.
4. The per-sender hourly limit caps total sends. Overflow jobs are **automatically rescheduled to the next hour**, preserving order as much as BullMQ's delayed queue allows.
5. The system continues processing across hours until all emails are sent.

---

## BullMQ Dashboard

Visit `/admin/queues` in your browser to see the live Bull Board UI:

- View **waiting**, **delayed**, **active**, **completed**, and **failed** jobs
- Retry failed jobs manually
- Inspect job data and error logs

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
  externalId  String?     @unique  // Nodemailer messageId
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
| **No cron** | BullMQ delayed jobs only | Matches assignment constraints; Redis persists jobs across restarts |
| **Idempotency** | `jobId = email.id` + DB status transaction | Prevents duplicate sends across restarts and concurrent workers |
| **Rate limit granularity** | Per-sender, per-hour | Matches real email provider throttling models |
| **Overflow strategy** | Reschedule to next hour | Jobs are never dropped; order is best-effort within BullMQ's delay queue |
| **SMTP** | Ethereal Email (Nodemailer) | Fake SMTP for safe testing — swap credentials for production SMTP |
| **Auth** | None on backend APIs | Authentication is handled at the frontend (Google OAuth); backend is internal |
| **Bull Board** | No auth on `/admin/queues` | Development convenience — should be protected in production |
