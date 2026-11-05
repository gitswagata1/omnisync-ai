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

## The Solution

OmniSync AI operates as an intelligent layer over a single WhatsApp Business Cloud API endpoint:

```
                     ┌─────────────────────────────────────────────┐
                     │           ONE WHATSAPP NUMBER               │
                     │     Multiple Agents · Identity Tags         │
                     │    (Micro Turner | Swagata | Purchase)      │
                     └──────────────────┬──────────────────────────┘
                                        │
              ┌─────────────────────────┼─────────────────────────┐
              │                         │                         │
              ▼                         ▼                         ▼
   ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
   │   AUTONOMOUS        │  │   AI RESPONSE       │  │   CROSS-DEPARTMENT │
   │   SCHEDULER         │  │   EVALUATOR          │  │   CONTEXT SYNC     │
   │                     │  │                      │  │                    │
   │  Cron-driven        │  │  LLM scores          │  │  Every interaction │
   │  reminders &        │  │  completeness &      │  │  visible to all    │
   │  escalation chains  │  │  compliance, then    │  │  relevant agents   │
   │                     │  │  auto-decides:       │  │  in real time      │
   │  Daily / Weekly /   │  │  ✓ Complete          │  │                    │
   │  Monthly / Custom   │  │  ? Follow up         │  │  Conflict detection│
   │                     │  │  ✗ Escalate          │  │  on commitments    │
   └─────────┬───────────┘  └──────────┬───────────┘  └──────────┬─────────┘
             │                         │                         │
             └─────────────────────────┼─────────────────────────┘
                                       ▼
                     ┌─────────────────────────────────────────────┐
                     │       EXECUTIVE INTELLIGENCE LAYER          │
                     │                                             │
                     │  Auto-generated daily / weekly / monthly    │
                     │  operational digests delivered directly to   │
                     │  VP's WhatsApp — no dashboards required     │
                     └─────────────────────────────────────────────┘
```

### Three Patented Innovations

| # | Innovation | What It Does |
|:-:|:-----------|:-------------|
| 1 | **Multi-Agent Context Multiplexing** | Multiple employees operate through one WhatsApp number with cryptographically-secured identity tags (`Company \| User \| Role`) and RBAC isolation |
| 2 | **Scheduler-LLM Execution Loop** | Cron-driven autonomous messaging with an LLM feedback loop that reads responses, evaluates compliance, and decides: complete, follow-up, or escalate |
| 3 | **Enterprise State Synchronization Protocol** | Every client/vendor interaction is propagated to all relevant departments in real time with conflict detection |

<br/>

---

## Demo

> **Screenshots and demo GIF coming soon** — the dashboard, scheduler, and VP digest in action.

<p align="center">
  <img src="docs/diagrams/demo-placeholder.png" alt="OmniSync AI Dashboard Demo" width="800"/>
</p>

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
│  FRONTEND DASHBOARD                          Next.js 14 + Socket.IO    │
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

```bash
git clone https://github.com/gitswagata1/omnisync-ai.git
cd omnisync-ai
cp .env.example .env
# Edit .env with your API keys

docker compose up -d
```

This starts the app, PostgreSQL, and Redis with a single command. The API is available at `http://localhost:3000`.

### Option B: Manual Setup

```bash
git clone https://github.com/gitswagata1/omnisync-ai.git
cd omnisync-ai
npm install
cp .env.example .env
# Edit .env with your credentials

npm run db:migrate
npm run db:seed        # loads demo agents, contacts, and schedules
npm run dev            # starts dev server with hot reload
```

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
├── src/
│   ├── api/                    # Express route handlers
│   │   ├── webhook.ts          # WhatsApp webhook receiver
│   │   ├── messages.ts         # Send/receive message endpoints
│   │   ├── schedules.ts        # Scheduler CRUD
│   │   ├── agents.ts           # Agent identity management
│   │   ├── contacts.ts         # Contact & department binding
│   │   └── analytics.ts        # Reporting & metrics
│   ├── services/               # Core business logic
│   │   ├── agent-identity.ts   # HMAC-secured role tag system
│   │   ├── message-router.ts   # Inbound demux / outbound mux
│   │   ├── scheduler-engine.ts # Bull queue + cron + state machine
│   │   ├── llm-evaluator.ts    # Response evaluation + digest gen
│   │   ├── context-sync.ts     # CESSP implementation
│   │   ├── escalation.ts       # Timeout detection + escalation
│   │   └── transcription.ts    # Whisper audio → text
│   ├── models/                 # Database models (Prisma)
│   ├── middleware/              # Auth, validation, rate limiting
│   ├── config/                 # Environment & app configuration
│   └── utils/                  # Shared utilities
├── docs/                       # Technical documentation
│   ├── architecture.md         # Full system architecture spec
│   └── api-reference/          # Endpoint documentation
├── research/                   # Academic research
│   ├── ieee_paper_draft.md     # IEEE Access paper (full draft)
│   └── data/                   # Pilot measurement data
├── patents/                    # Intellectual property
│   ├── patent_claims.md        # Formal utility patent claims
│   ├── disclosures/            # Invention Disclosure Forms
│   └── prior-art/              # Prior art analysis
├── pitch/                      # Venture strategy
│   ├── vc_deck_outline.md      # 12-slide investor deck
│   └── financials/             # Unit economics & projections
├── scripts/                    # Seed data & utilities
├── tests/                      # Unit & integration tests
├── Dockerfile                  # Multi-stage production build
├── docker-compose.yml          # Full local dev stack
├── .env.example
├── package.json
└── tsconfig.json
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
| **Frontend** | Next.js 14, React, Tailwind CSS, shadcn/ui, Socket.IO |
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
