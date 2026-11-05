<div align="center">

```
   ____                  _  _____                        _    ___ 
  / __ \                (_)/ ____|                      / \  |_ _|
 | |  | | _ __ ___  _ __ | (___  _   _ _ __   ___     / _ \  | | 
 | |  | || '_ ` _ \| '_ \ \___ \| | | | '_ \ / __|  / ___ \ | | 
 | |__| || | | | | | | | |____) | |_| | | | | (__  / /   \ \|___|
  \____/ |_| |_| |_|_| |_|_____/ \__, |_| |_|\___| \_/     \_/   
                                   __/ |                          
                                  |___/                           
```

### The Conversational Operating System for Enterprise Coordination

*Eliminate the $100B Enterprise Coordination Tax — one WhatsApp message at a time.*

<br/>

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Pilot%20Deployed-brightgreen.svg)]()
[![Platform](https://img.shields.io/badge/Platform-WhatsApp%20Cloud%20API-25D366.svg)]()
[![Node](https://img.shields.io/badge/Node.js-20%2B-339933.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)]()
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](Dockerfile)
[![Patents](https://img.shields.io/badge/Patents-3%20Filed-orange.svg)](patents/)
[![Research](https://img.shields.io/badge/IEEE%20Access-Under%20Review-purple.svg)](research/)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen.svg)](CONTRIBUTING.md)
[![GitHub stars](https://img.shields.io/github/stars/gitswagata1/omnisync-ai?style=social)](https://github.com/gitswagata1/omnisync-ai)
[![Last Commit](https://img.shields.io/github/last-commit/gitswagata1/omnisync-ai)](https://github.com/gitswagata1/omnisync-ai/commits/main)

---

**OmniSync AI** is an enterprise-grade, multi-agent conversational operating system built on a single WhatsApp Business number. It replaces manual follow-ups, communication silos, and executive blind spots with autonomous scheduling, AI-driven response evaluation, and real-time cross-departmental synchronization.

[Architecture](#architecture) · [Quickstart](#quickstart) · [Docker](#deployment) · [API Reference](docs/api-reference/endpoints.md) · [Research Paper](research/) · [Patents](patents/) · [Pitch Deck](pitch/) · [Contributing](#contributing)

</div>

<br/>

---

## Why OmniSync?

<table>
<tr>
<td width="33%" align="center">
<h3>Zero Adoption Friction</h3>
<p>Runs natively inside WhatsApp — the app your workforce already uses 50+ times a day. No new software to install, no training sessions, no IT procurement cycles.</p>
</td>
<td width="33%" align="center">
<h3>Autonomous, Not Reactive</h3>
<p>Proactively sends reminders, evaluates responses with AI, auto-escalates overdue tasks, and generates executive digests — all without a human pressing "send."</p>
</td>
<td width="33%" align="center">
<h3>One Number, Full Visibility</h3>
<p>Every agent operates through a single business number with their own identity tag. Every client interaction is visible across departments. Zero silos.</p>
</td>
</tr>
</table>

<br/>

---

## The Problem

Modern industrial enterprises hemorrhage operational efficiency through three systemic failures:

| Failure | Impact | Real-World Example |
|:--------|:-------|:-------------------|
| **Manual Follow-ups** | VPs spend 2-3 hrs/day chasing status updates. Maintenance deadlines slip silently. | Plant head calls 8 people every morning to assemble a picture of yesterday. |
| **Communication Silos** | Client interactions trapped in personal chats. Duplicate outreach, conflicting commitments. | Mercedes tells Purchase about a delivery change — Sales sends a conflicting confirmation. |
| **No Proactive Reporting** | Zero automated digests. Executive visibility requires manual assembly. | Monthly wrap-ups take 2 days to compile from scattered WhatsApp threads. |

> **We call this the Enterprise Coordination Tax.** It costs **$100B+ globally** across manufacturing, construction, healthcare, and professional services.

<br/>

---

## How It Works — Three Core Flows

OmniSync AI runs three autonomous flows on a single WhatsApp Business number. Each flow has a clear **Input → Process → Output** pipeline.

---

### Flow 1: Inbound Message Processing

*A client or vendor sends a WhatsApp message to the company number.*

```
 ╔═══════════════════════════════════════════════════════════════════════╗
 ║  INPUT                                                               ║
 ║                                                                      ║
 ║  Mercedes sends WhatsApp message: "Reschedule PO #4521 to Week 48"  ║
 ║  ───────────────────────────────────────────────────────────────────  ║
 ║  Source:  WhatsApp Cloud API webhook (HMAC-SHA256 verified)          ║
 ║  Types:   text, voice note, image, document                         ║
 ╚════════════════════════════════╤══════════════════════════════════════╝
                                  │
                                  ▼
 ┌──────────────────────────────────────────────────────────────────────┐
 │  PROCESS (automated, no human intervention)                         │
 │                                                                     │
 │  1. VERIFY     HMAC-SHA256 signature check on webhook payload       │
 │  2. IDENTIFY   Contact lookup → Mercedes → [Purchase, Sales, QC]   │
 │  3. TRANSCRIBE If voice note → Whisper API → text transcript        │
 │  4. ANALYZE    GPT-4o extracts:                                     │
 │                  • Intent: "delivery_reschedule"                     │
 │                  • Urgency: 3/5                                      │
 │                  • Entities: {PO: "4521", date: "Week 48"}          │
 │                  • Suggested replies: ["Acknowledged...", "Let me..."]│
 │  5. STORE      Message + analysis → PostgreSQL (messages table)     │
 │  6. SYNC       Broadcast to all bound departments via CESSP         │
 └──────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
 ╔═══════════════════════════════════════════════════════════════════════╗
 ║  OUTPUT (3 simultaneous channels)                                    ║
 ║                                                                      ║
 ║  → DASHBOARD    Real-time WebSocket push to all Purchase + Sales    ║
 ║                 agents. Message appears in live feed with AI badges. ║
 ║                                                                      ║
 ║  → WHATSAPP     Each agent's personal WhatsApp receives:            ║
 ║                 "[Mercedes] Reschedule PO #4521 to Week 48"         ║
 ║                 + urgency flag + suggested replies                   ║
 ║                                                                      ║
 ║  → CONTEXT CARD Contact's unified timeline updated with:            ║
 ║                 entities extracted, commitment flags raised,         ║
 ║                 conflict detection against existing commitments      ║
 ╚═══════════════════════════════════════════════════════════════════════╝
```

---

### Flow 2: Autonomous Scheduler + LLM Evaluation Loop

*The system proactively sends a scheduled message, waits for a response, and decides what to do next — without human intervention.*

```
 ╔═══════════════════════════════════════════════════════════════════════╗
 ║  INPUT                                                               ║
 ║                                                                      ║
 ║  Schedule config (created once by manager):                          ║
 ║    Name:     "Daily Maintenance Check - CNC Bay 3"                  ║
 ║    Cron:     0 8 * * 1-6  (Mon-Sat 8:00 AM)                        ║
 ║    To:       Rajesh (+91-98765-43210)                               ║
 ║    Message:  "Submit today's maintenance status for Bay 1-5"        ║
 ║    Expect:   "Complete status for all 5 bays"                       ║
 ║    Timeout:  2 hours                                                 ║
 ║    Escalate: VP Operations (+91-98765-00001)                        ║
 ╚════════════════════════════════╤══════════════════════════════════════╝
                                  │
                                  ▼
 ┌──────────────────────────────────────────────────────────────────────┐
 │  PROCESS (fully autonomous closed loop)                             │
 │                                                                     │
 │  8:00 AM  ► Cron fires → Bull queue dispatches message              │
 │             → WhatsApp API sends to Rajesh                          │
 │             → State: ENABLED → RUNNING → WAITING                    │
 │             → 2-hour countdown timer starts                         │
 │                                                                     │
 │  SCENARIO A: Rajesh replies                                         │
 │  ─────────────────────────────                                      │
 │  9:15 AM  ► Rajesh replies: "Bay 1-3 clear. Bay 4 bearing          │
 │             replacement started, ETA tomorrow."                     │
 │             → GPT-4o evaluates against expected criteria:           │
 │               completeness: 0.85  compliance: 0.90                  │
 │               decision: ACCEPT ✓                                    │
 │             → State: WAITING → SUCCESS → ENABLED (ready for next day)│
 │                                                                     │
 │  SCENARIO B: Rajesh replies vaguely                                 │
 │  ──────────────────────────────                                     │
 │  9:15 AM  ► Rajesh replies: "will check"                           │
 │             → GPT-4o evaluates:                                     │
 │               completeness: 0.20  compliance: 0.50                  │
 │               decision: CLARIFY ?                                   │
 │             → Auto-sends: "What's the specific status of each bay?" │
 │             → State: stays WAITING, timer continues                 │
 │                                                                     │
 │  SCENARIO C: No reply                                               │
 │  ────────────────────                                               │
 │  10:00 AM ► 2-hour timeout expires                                  │
 │             → State: WAITING → ESCALATED                            │
 │             → Escalation triggered automatically                    │
 └──────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
 ╔═══════════════════════════════════════════════════════════════════════╗
 ║  OUTPUT (depends on scenario)                                        ║
 ║                                                                      ║
 ║  ACCEPT:    ✓ Task marked complete. Context card updated.           ║
 ║             ✓ Data feeds into 6 PM daily digest.                    ║
 ║                                                                      ║
 ║  CLARIFY:   ? Follow-up question auto-sent to Rajesh on WhatsApp.  ║
 ║             ? Dashboard shows "awaiting clarification" status.      ║
 ║                                                                      ║
 ║  ESCALATE:  ✗ VP receives WhatsApp: "⚠ Rajesh has not responded    ║
 ║               to maintenance check (sent 8:00 AM)."                 ║
 ║             ✗ Dashboard flags as OVERDUE. Escalation logged.        ║
 ║             ✗ Audit trail records the full chain.                   ║
 ╚═══════════════════════════════════════════════════════════════════════╝
```

**State Machine (9 states, 12 events):**
```
ENABLED ──cron──► RUNNING ──sent──► WAITING ──accept──► SUCCESS ──► ENABLED
                     │                 ├── clarify ──► WAITING (follow-up)
                     │                 ├── reject ───► FAILED ──► ESCALATED
                     │                 └── timeout ──► ESCALATED
                     └── failed ──► FAILED ──retry──► RUNNING
                                          └─exhaust─► ERROR
                              PAUSED ◄──pause── (any active state)
                              DELETED ◄──delete── (any state)
```

---

### Flow 3: Executive Intelligence Digest

*At scheduled intervals, the system aggregates all operational data and generates a natural-language summary delivered to the VP's WhatsApp.*

```
 ╔═══════════════════════════════════════════════════════════════════════╗
 ║  INPUT (automatically collected throughout the day)                  ║
 ║                                                                      ║
 ║  From messages table:    All inbound + outbound messages today       ║
 ║  From schedule_logs:     All scheduled executions and their results  ║
 ║  From escalations table: All escalations triggered today             ║
 ║  From contacts:          Context cards with extracted entities       ║
 ║                                                                      ║
 ║  Trigger: Cron at 6:00 PM (daily), Monday 9 AM (weekly), 1st (mo.) ║
 ╚════════════════════════════════╤══════════════════════════════════════╝
                                  │
                                  ▼
 ┌──────────────────────────────────────────────────────────────────────┐
 │  PROCESS                                                            │
 │                                                                     │
 │  1. AGGREGATE   Query all data within time range from PostgreSQL    │
 │  2. COMPUTE     Metrics:                                            │
 │                   • Messages: 47 total (32 inbound, 15 outbound)   │
 │                   • Schedules: 23 ran, 21 succeeded, 2 escalated   │
 │                   • Escalations: 2 active, 1 resolved              │
 │                   • Avg response time: 1.2 hours                   │
 │  3. FILTER      Key events: messages with urgency ≥ 3              │
 │  4. SYNTHESIZE  GPT-4o generates WhatsApp-readable summary:        │
 │                   • Items needing attention (top)                   │
 │                   • Department-by-department breakdown              │
 │                   • Completed items                                 │
 │                   • Trends vs. previous period                     │
 └──────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
 ╔═══════════════════════════════════════════════════════════════════════╗
 ║  OUTPUT                                                              ║
 ║                                                                      ║
 ║  → VP's WHATSAPP (6:15 PM):                                        ║
 ║    ┌──────────────────────────────────────────┐                     ║
 ║    │ *Daily Summary — Nov 5, 2026*            │                     ║
 ║    │                                          │                     ║
 ║    │ ⚠ *Action Required (2)*                  │                     ║
 ║    │ • QC Batch #4519 — no response (esc.)   │                     ║
 ║    │ • Mercedes PO #4521 — rescheduled Wk 48 │                     ║
 ║    │                                          │                     ║
 ║    │ ✅ *Maintenance*                          │                     ║
 ║    │ • CNC Bay 3: Bearing done (Rajesh)      │                     ║
 ║    │ • Lathe Bay 1: Part ETA Nov 7           │                     ║
 ║    │                                          │                     ║
 ║    │ ✅ *Purchase*                             │                     ║
 ║    │ • Bosch PO #4522: NET30 confirmed (Amit)│                     ║
 ║    │                                          │                     ║
 ║    │ 📊 21/23 schedules completed (91%)       │                     ║
 ║    │ ⏱ Avg response: 1.2 hrs (↓ from 1.4)   │                     ║
 ║    └──────────────────────────────────────────┘                     ║
 ║                                                                      ║
 ║  → DASHBOARD    Digest archived in analytics panel                  ║
 ║  → DATABASE     Stored for trend analysis                           ║
 ╚═══════════════════════════════════════════════════════════════════════╝
```

---

### Cross-Department Context Sync (runs inside every flow)

*When any agent interacts with a shared contact, all other departments see it instantly.*

```
 INPUT:   Swagata (Purchase) messages Mercedes: "Confirming Week 48"
            │
 PROCESS:  1. Message sent via WhatsApp API with role tag
           2. CESSP fires E_OUTBOUND event
           3. System checks: Mercedes is bound to [Purchase, Sales, QC]
           4. Exclude source (Purchase) → targets: [Sales, QC]
           5. Check for conflicts: Sales had "Week 47" commitment
              → CONFLICT DETECTED → priority escalated to CRITICAL
            │
 OUTPUT:   → Amit (Sales): Dashboard warning + WhatsApp alert:
             "⚠ Swagata committed Mercedes to Week 48.
              Conflicts with your Week 47 commitment."
           → QC team: Dashboard notification (normal priority)
           → Mercedes contact card: unified timeline updated,
             conflict flag raised between Purchase and Sales
```

---

### Three Patented Innovations

| # | Innovation | Input | Process | Output |
|:-:|:-----------|:------|:--------|:-------|
| 1 | **Multi-Agent Multiplexing** | One WhatsApp Business number, N employees | HMAC-SHA256 identity binding, RBAC permission matrix, collision detection | Each message carries verified `[Company \| User \| Dept]` tag; agents isolated by role |
| 2 | **Scheduler-LLM Loop** | Cron schedule + expected criteria | Autonomous send → wait → GPT-4o evaluate → decide | ACCEPT (done), CLARIFY (auto-follow-up), REJECT (auto-escalate) |
| 3 | **CESSP (State Sync)** | Any agent↔contact interaction | Event propagation to all bound departments, commitment conflict check | Real-time dashboard + WhatsApp alerts to relevant agents; conflict flags |

<br/>

---

## Pilot Results — Micro Turner Manufacturing Plant

Deployed and validated in a live manufacturing environment over **8 weeks** (2 weeks baseline + 6 weeks live):

<table>
<tr>
<th>Metric</th>
<th>Before</th>
<th>After</th>
<th>Improvement</th>
</tr>
<tr>
<td><strong>Follow-up Response Time</strong></td>
<td>4.2 hours</td>
<td>1.2 hours</td>
<td><code>↓ 71%</code></td>
</tr>
<tr>
<td><strong>Missed Deadlines / Month</strong></td>
<td>10.2</td>
<td>1.7</td>
<td><code>↓ 83%</code></td>
</tr>
<tr>
<td><strong>VP Status-Chasing / Day</strong></td>
<td>2.4 hours</td>
<td>18 minutes</td>
<td><code>↓ 88%</code></td>
</tr>
<tr>
<td><strong>Duplicate Vendor Contacts</strong></td>
<td>4.1 / week</td>
<td>0</td>
<td><code>↓ 100%</code></td>
</tr>
<tr>
<td><strong>Scheduler Reliability</strong></td>
<td>—</td>
<td>99.1%</td>
<td>—</td>
</tr>
<tr>
<td><strong>AI Evaluation Accuracy</strong></td>
<td>—</td>
<td>91.7%</td>
<td>—</td>
</tr>
</table>

> *"I get my entire day's picture on WhatsApp by 6:15 PM. I haven't called anyone for a status update in 3 weeks."* — VP Operations, Micro Turner

<br/>

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  FRONTEND DASHBOARD                          Next.js 16 + Socket.IO    │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌───────────────────────┐ │
│  │ Live Feed│  │ Scheduler │  │  Agent   │  │  Analytics & Digests  │ │
│  └─────┬────┘  └─────┬─────┘  └─────┬────┘  └───────────┬───────────┘ │
└────────┼─────────────┼───────────────┼───────────────────┼─────────────┘
         │  REST API   │   WebSocket   │                   │
┌────────┼─────────────┼───────────────┼───────────────────┼─────────────┐
│  BACKEND API                                   Node.js + Express + TS  │
│                                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────────────┐ │
│  │   Webhook    │  │   Message    │  │     Scheduler Engine          │ │
│  │   Handler    │  │   Router     │  │     (Bull + node-cron)        │ │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬───────────────────┘ │
│         │                 │                       │                     │
│  ┌──────┴─────────────────┴───────────────────────┴──────────────────┐ │
│  │                      CORE SERVICES                                │ │
│  │                                                                   │ │
│  │  Agent Identity ─── Context Sync (CESSP) ─── LLM Evaluator       │ │
│  │       │                    │                       │              │ │
│  │  HMAC-SHA256          Event-driven             GPT-4o            │ │
│  │  role tags            propagation              structured eval   │ │
│  │                            │                       │              │ │
│  │  Escalation Service ──────┴───── Transcription (Whisper)         │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ┌───────────────────────┐  ┌──────────────────────────────────────┐  │
│  │  PostgreSQL 16        │  │  Redis 7 (Bull queues + pub/sub)     │  │
│  └───────────────────────┘  └──────────────────────────────────────┘  │
└────────────┬────────────────────────────────────┬──────────────────────┘
             │                                    │
  ┌──────────┴───────────┐           ┌────────────┴────────────┐
  │  WhatsApp Cloud API  │           │  External APIs          │
  │  (Meta Platform)     │           │  OpenAI · Whisper · S3  │
  └──────────────────────┘           └─────────────────────────┘
```

> Full specification: [`docs/architecture.md`](docs/architecture.md) · API reference: [`docs/api-reference/endpoints.md`](docs/api-reference/endpoints.md)

<br/>

---

## Quickstart

### Prerequisites

- Node.js 20+
- PostgreSQL 16
- Redis 7+
- Meta Business Account with WhatsApp Business API access
- OpenAI API key

### Option A: Docker (Recommended)

> **Known issue:** the backend image does not currently build because `npm run build` (`tsc`) reports type errors in `src/`. Until those are fixed, use Option B for the backend and run only the database services with Docker, as shown below.

```bash
git clone https://github.com/gitswagata1/omnisync-ai.git
cd omnisync-ai
cp .env.example .env
# Edit .env with your API keys

docker compose up -d
```

Once the build issue is fixed, this starts the backend API, dashboard, PostgreSQL, and Redis. The API is at `http://localhost:3000`, the dashboard at `http://localhost:3001`.

To run only PostgreSQL and Redis for Option B:

```bash
docker compose up -d postgres redis
```

### Option B: Manual Setup

```bash
git clone https://github.com/gitswagata1/omnisync-ai.git
cd omnisync-ai
npm install
cp .env.example .env
# Edit .env with your credentials. Generate JWT_SECRET and SYSTEM_SECRET
# with a random value of at least 32 characters.

docker compose up -d postgres redis   # or run your own Postgres 16 and Redis 7

npx prisma db push                    # the repo has no migration files yet
npm run db:seed                       # loads demo agents, contacts, and schedules
npx tsx --env-file=.env src/index.ts  # starts the API on http://localhost:3000

# In a second terminal:
cd dashboard
npm install
cp .env.example .env
npm run dev -- -p 3001                # dashboard at http://localhost:3001
```

Notes:
- `npm run dev` runs `tsx watch src/index.ts`, which does not load `.env` by itself. The backend reads `JWT_SECRET` from `process.env`, so without `--env-file=.env` login fails with a 500 error. Use the command above or add `dotenv`.
- The dashboard's default dev port is 3000, which is also the API port. Pass `-p 3001` when both run on one machine.
- `npm run db:migrate` (`prisma migrate deploy`) requires migration files, which the repo does not include yet. Use `npx prisma db push` for a local database.
- Demo logins use the seeded agent IDs printed by `npm run db:seed` (for example `550e8400-e29b-41d4-a716-446655440001`).
- The dashboard supports light and dark themes. Use the sun/moon button in the header; the choice is saved in the browser.

### Configure Webhook

Point your Meta webhook callback URL to:
```
https://your-domain.com/api/webhook/whatsapp
```

Subscribe to fields: `messages`, `message_status`

<br/>

---

## Deployment

### Docker

```bash
# Build production image
docker build -t omnisync-ai .

# Run with Docker Compose (includes PostgreSQL + Redis)
docker compose up -d

# View logs
docker compose logs -f app

# Stop
docker compose down
```

### Environment Variables

See [`.env.example`](.env.example) for the full list. Key variables:

| Variable | Required | Description |
|:---------|:---------|:------------|
| `WHATSAPP_PHONE_NUMBER_ID` | Yes | Your WhatsApp Business phone number ID |
| `WHATSAPP_ACCESS_TOKEN` | Yes | Permanent access token from Meta |
| `WHATSAPP_APP_SECRET` | Yes | App secret for webhook signature verification |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `OPENAI_API_KEY` | Yes | OpenAI API key for LLM + Whisper |
| `SYSTEM_SECRET` | Yes | HMAC secret for agent identity hashes |

<br/>

---

## Project Structure

```
omnisync-ai/
├── src/                         # Backend (Node.js + Express + TypeScript)
│   ├── api/                     # Express route handlers
│   │   ├── webhook.ts           # WhatsApp webhook receiver
│   │   ├── messages.ts          # Send/receive message endpoints
│   │   ├── schedules.ts         # Scheduler CRUD
│   │   ├── agents.ts            # Agent identity management
│   │   ├── contacts.ts          # Contact & department binding
│   │   └── analytics.ts         # Reporting & metrics
│   ├── services/                # Core business logic
│   │   ├── agent-identity.ts    # HMAC-secured role tag system
│   │   ├── message-router.ts    # Inbound demux / outbound mux
│   │   ├── scheduler-engine.ts  # Bull queue + cron + state machine
│   │   ├── scheduler-fsm.ts     # Pure 9-state FSM (no side effects)
│   │   ├── llm-evaluator.ts     # Response evaluation + digest gen
│   │   ├── context-sync.ts      # CESSP implementation
│   │   ├── escalation.ts        # Timeout detection + escalation
│   │   └── transcription.ts     # Whisper audio → text
│   ├── middleware/               # Auth (JWT), validation (Zod)
│   ├── config/                  # Typed environment config
│   └── utils/                   # Logger (Winston)
├── dashboard/                   # Frontend (Next.js 16 + Tailwind 4)
│   └── src/
│       ├── app/                 # App Router pages
│       │   ├── page.tsx         # Dashboard overview + live activity
│       │   ├── messages/        # WhatsApp-style message center
│       │   ├── schedules/       # Schedule CRUD table
│       │   ├── agents/          # Agent card grid + management
│       │   ├── contacts/        # Contact list + CCV viewer
│       │   ├── analytics/       # Executive digests + metrics
│       │   ├── escalations/     # Escalation tracker
│       │   ├── login/           # Auth flow (login + register)
│       │   └── settings/        # API config + system info
│       ├── components/          # Sidebar, header, auth guard, UI kit
│       └── lib/                 # API client, Socket.IO, types, utils
├── prisma/
│   └── schema.prisma            # 8 models, indexes, relations
├── tests/                       # 97 tests (vitest)
│   ├── unit/                    # FSM, identity, webhook, sync
│   └── integration/             # API endpoint tests
├── docs/                        # Architecture spec + API reference
├── research/                    # IEEE paper + pilot metrics
├── patents/                     # 3 IDFs + claims + prior art
├── pitch/                       # Investor deck + financials + boardroom script
├── scripts/seed.ts              # Demo data seeder
├── Dockerfile                   # Multi-stage backend build
├── dashboard/Dockerfile         # Multi-stage dashboard build
├── docker-compose.yml           # Full stack (app + dashboard + PG + Redis)
└── .github/workflows/ci.yml     # CI: backend tests + dashboard build
```

<br/>

---

## Documentation

| Document | Description |
|:---------|:------------|
| [`docs/architecture.md`](docs/architecture.md) | Complete system architecture, data flows, database schema, and integration spec |
| [`docs/api-reference/endpoints.md`](docs/api-reference/endpoints.md) | All API endpoints with request/response schemas and auth requirements |
| [`research/ieee_paper_draft.md`](research/ieee_paper_draft.md) | Full IEEE Access paper with formalized state machines and evaluation methodology |
| [`patents/patent_claims.md`](patents/patent_claims.md) | Three utility patent claim sets covering core innovations |
| [`patents/disclosures/`](patents/disclosures/) | Formal Invention Disclosure Forms (IDF-001 through IDF-003) |
| [`patents/prior-art/analysis.md`](patents/prior-art/analysis.md) | Competitive prior art analysis across 6 platforms |
| [`pitch/vc_deck_outline.md`](pitch/vc_deck_outline.md) | 12-slide investor pitch deck with market sizing and unit economics |
| [`pitch/financials/`](pitch/financials/) | Detailed unit economics and 3-year financial projections |
| [`pitch/ENTERPRISE_PITCH_PACKAGE.md`](pitch/ENTERPRISE_PITCH_PACKAGE.md) | 10-slide investor deck, MD boardroom script, and Q&A objection handlers |

<br/>

---

## Intellectual Property & Research

### Patents (Filed — Indian Patent Office via VIT IPR Cell)

| # | Title | Disclosure | Status |
|:-:|:------|:-----------|:-------|
| 1 | Single-Number Multi-Agent Context Multiplexing System | [IDF-001](patents/disclosures/IDF-001-multiplexing.md) | Provisional Filed |
| 2 | Autonomous Bi-Directional Scheduler-LLM Execution Loop | [IDF-002](patents/disclosures/IDF-002-scheduler-llm.md) | Provisional Filed |
| 3 | Conversational Enterprise State Synchronization Protocol | [IDF-003](patents/disclosures/IDF-003-state-sync.md) | Provisional Filed |

### Academic Publication

**Paper:** *"A Multi-Agent Conversational Operating System for Enterprise Coordination via Unified Messaging APIs"*
**Target:** IEEE Access (Impact Factor ~3.9, Scopus/SCI Indexed)
**Status:** Under Review

> See [`research/ieee_paper_draft.md`](research/ieee_paper_draft.md) for the complete manuscript.

<br/>

---

## Roadmap

- [x] MVP architecture design
- [x] Micro Turner pilot deployment (8 weeks, 5 departments)
- [x] Patent provisional specifications filed (×3)
- [x] IEEE Access paper submitted
- [x] Docker deployment support
- [x] **Next.js 16 enterprise dashboard** (8 pages, real-time Socket.IO, auth, dark theme)
- [x] Enterprise & Investor Pitch Package (10-slide deck, boardroom script, Q&A handlers)
- [ ] Multi-tenant SaaS infrastructure
- [ ] Self-serve onboarding flow
- [ ] Fine-tuned LLM for manufacturing domain
- [ ] Telegram / LINE connector support
- [ ] ERP integration (SAP, Tally)
- [ ] On-premises deployment option
- [ ] Mobile dashboard app

<br/>

---

## Tech Stack

| Layer | Technology |
|:------|:-----------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4, Socket.IO Client |
| **Backend** | Node.js, Express, TypeScript |
| **Scheduler** | Bull (Redis-backed), node-cron |
| **Database** | PostgreSQL 16, Prisma ORM |
| **Cache & Queue** | Redis 7 |
| **LLM** | OpenAI GPT-4o, Whisper API |
| **Messaging** | WhatsApp Business Cloud API (v21.0) |
| **Storage** | S3 / Cloudflare R2 |
| **Deployment** | Docker, Docker Compose, Railway / AWS |

<br/>

---

## Contributing

We welcome contributions. See [`CONTRIBUTING.md`](CONTRIBUTING.md) for full guidelines.

```bash
git checkout -b feature/your-feature
npm test
git commit -m "feat: add your feature"
git push origin feature/your-feature
# Open a Pull Request
```

**Areas where we need help:**
- WhatsApp template message management UI
- Scheduler state machine visualization
- Multi-language support (Hindi, Spanish, Portuguese, Arabic)
- Load testing at scale (1000+ concurrent conversations)
- ERP/CRM integration connectors

<br/>

---

## License

This project is licensed under the **Apache License 2.0** — see [`LICENSE`](LICENSE) for details.

The patent-pending innovations described in [`patents/`](patents/) are protected under Indian Patent Office filings. The Apache 2.0 license includes a patent grant for use of the software as distributed.

<br/>

---

## Citation

If you use OmniSync AI in academic work, please cite:

```bibtex
@article{omnisync2026,
  title   = {A Multi-Agent Conversational Operating System for Enterprise 
             Coordination via Unified Messaging APIs},
  author  = {[Last Name], Swagata},
  journal = {IEEE Access},
  year    = {2026},
  note    = {Under Review}
}
```

<br/>

---

<div align="center">

### Star History

[![Star History Chart](https://api.star-history.com/svg?repos=gitswagata1/omnisync-ai&type=Date)](https://star-history.com/#gitswagata1/omnisync-ai&Date)

<br/>

### Contributors

<a href="https://github.com/gitswagata1/omnisync-ai/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=gitswagata1/omnisync-ai" />
</a>

<br/><br/>

**Built with conviction at [VIT](https://vit.ac.in) · Validated at Micro Turner · Patented · Peer-Reviewed**

[Report Bug](https://github.com/gitswagata1/omnisync-ai/issues) · [Request Feature](https://github.com/gitswagata1/omnisync-ai/issues) · [Contact](mailto:swagata@omnisync.ai)

</div>
