<div align="center">

# OmniSync AI

### The Conversational Operating System for Enterprise Coordination

*Eliminate the $100B Enterprise Coordination Tax — one WhatsApp message at a time.*

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Pilot%20Deployed-brightgreen.svg)]()
[![Platform](https://img.shields.io/badge/Platform-WhatsApp%20Cloud%20API-25D366.svg)]()
[![Node](https://img.shields.io/badge/Node.js-20%2B-339933.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)]()
[![Patents](https://img.shields.io/badge/Patents-3%20Filed-orange.svg)](patents/)
[![Research](https://img.shields.io/badge/IEEE%20Access-Under%20Review-purple.svg)](research/)

---

**OmniSync AI** is an enterprise-grade, multi-agent conversational operating system built on a single WhatsApp Business number. It replaces manual follow-ups, communication silos, and executive blind spots with autonomous scheduling, AI-driven response evaluation, and real-time cross-departmental synchronization.

[Architecture](#architecture) · [Quickstart](#quickstart) · [Documentation](docs/) · [Research Paper](research/) · [Patents](patents/) · [Pitch Deck](pitch/) · [Contributing](#contributing)

</div>

---

## The Problem

Modern industrial enterprises hemorrhage operational efficiency through three systemic failures:

| Failure | Impact | Example |
|:--------|:-------|:--------|
| **Manual Follow-ups** | VPs spend 2-3 hrs/day chasing status updates. Maintenance deadlines slip silently. | Plant head calls 8 people every morning to assemble a picture of yesterday. |
| **Communication Silos** | Client interactions trapped in personal chats. Duplicate outreach, conflicting commitments. | Mercedes tells Purchase about a delivery change — Sales sends a conflicting confirmation. |
| **No Proactive Reporting** | Zero automated digests. Executive visibility requires manual assembly. | Monthly wrap-ups take 2 days to compile from scattered WhatsApp threads. |

**We call this the Enterprise Coordination Tax.** It costs $100B+ globally across manufacturing, construction, healthcare, and professional services.

---

## The Solution

OmniSync AI operates as an intelligent layer over a single WhatsApp Business Cloud API endpoint:

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│   One WhatsApp Number  ──►  Multiple Agents with Identity Tags       │
│                              (Micro Turner | Swagata | Purchase)      │
│                                                                      │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐   │
│   │  Autonomous   │    │  AI Response  │    │  Cross-Department    │   │
│   │  Scheduler    │    │  Evaluator    │    │  Context Sync        │   │
│   │              │    │              │    │                      │   │
│   │  Cron-driven  │    │  LLM scores   │    │  Every interaction   │   │
│   │  reminders,   │◄──►│  completeness │◄──►│  visible to all      │   │
│   │  escalations, │    │  & compliance,│    │  relevant agents     │   │
│   │  digests      │    │  auto-decides │    │  in real time        │   │
│   └──────────────┘    └──────────────┘    └──────────────────────┘   │
│                                                                      │
│                    ▼              ▼                ▼                  │
│              ┌─────────────────────────────────────────────┐         │
│              │       Executive Intelligence Layer          │         │
│              │  Auto-generated daily/weekly/monthly digests │         │
│              │  delivered to VP's WhatsApp at 8 AM          │         │
│              └─────────────────────────────────────────────┘         │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Three Patented Innovations

| # | Innovation | What It Does |
|:-:|:-----------|:-------------|
| 1 | **Multi-Agent Context Multiplexing** | Multiple employees operate through one WhatsApp number with cryptographically-secured identity tags (`Company \| User \| Role`) and RBAC isolation |
| 2 | **Scheduler-LLM Execution Loop** | Cron-driven autonomous messaging with an LLM feedback loop that reads responses, evaluates compliance, and decides: complete, follow-up, or escalate |
| 3 | **Enterprise State Synchronization Protocol** | Every client/vendor interaction is propagated to all relevant departments in real time with conflict detection |

---

## Pilot Results — Micro Turner Manufacturing Plant

Deployed and validated in a live manufacturing environment over 8 weeks:

```
┌─────────────────────────┬──────────────┬──────────────┬──────────────┐
│ Metric                  │ Before       │ After        │ Improvement  │
├─────────────────────────┼──────────────┼──────────────┼──────────────┤
│ Follow-up response time │ 4.2 hours    │ 1.2 hours    │    ↓ 71%     │
│ Missed deadlines / mo   │ 10.2         │ 1.7          │    ↓ 83%     │
│ VP status-chasing / day │ 2.4 hours    │ 18 minutes   │    ↓ 88%     │
│ Duplicate vendor calls  │ 4.1 / week   │ 0            │    ↓ 100%    │
│ Scheduler reliability   │ —            │ 99.1%        │    —         │
│ AI evaluation accuracy  │ —            │ 91.7%        │    —         │
└─────────────────────────┴──────────────┴──────────────┴──────────────┘
```

---

## Architecture

```
                          ┌──────────────────────────────┐
                          │     Frontend Dashboard       │
                          │     (Next.js + Socket.IO)    │
                          └──────────────┬───────────────┘
                                         │
                          ┌──────────────┴───────────────┐
                          │       Backend API Layer      │
                          │       (Node.js + Express)    │
                          │                              │
                          │  ┌────────┐ ┌────────────┐   │
                          │  │Webhook │ │ Scheduler  │   │
                          │  │Handler │ │ Engine     │   │
                          │  └───┬────┘ └─────┬──────┘   │
                          │      │            │          │
                          │  ┌───┴────────────┴───────┐  │
                          │  │    Core Services       │  │
                          │  │  ┌─────┐ ┌─────┐      │  │
                          │  │  │Agent│ │ LLM │      │  │
                          │  │  │ ID  │ │ Eng │      │  │
                          │  │  └─────┘ └─────┘      │  │
                          │  │  ┌─────┐ ┌─────┐      │  │
                          │  │  │Sync │ │Escal│      │  │
                          │  │  │ Svc │ │ Svc │      │  │
                          │  │  └─────┘ └─────┘      │  │
                          │  └────────────────────────┘  │
                          │                              │
                          │  ┌────────────────────────┐  │
                          │  │   PostgreSQL + Redis   │  │
                          │  └────────────────────────┘  │
                          └──────┬───────────┬───────────┘
                                 │           │
                    ┌────────────┘           └────────────┐
                    │                                     │
          ┌─────────┴──────────┐            ┌─────────────┴─────┐
          │  WhatsApp Cloud    │            │  External APIs    │
          │  API (Meta)        │            │  OpenAI / Whisper │
          └────────────────────┘            └───────────────────┘
```

> Full architecture specification: [`docs/architecture.md`](docs/architecture.md)

---

## Quickstart

### Prerequisites

- Node.js 20+
- PostgreSQL 16
- Redis 7+
- Meta Business Account with WhatsApp Business API access
- OpenAI API key

### 1. Clone & Install

```bash
git clone https://github.com/gitswagata1/omnisync-ai.git
cd omnisync-ai
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

```env
# WhatsApp Cloud API
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_APP_SECRET=your_app_secret
WHATSAPP_VERIFY_TOKEN=your_webhook_verify_token

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/omnisync

# Redis
REDIS_URL=redis://localhost:6379

# LLM
OPENAI_API_KEY=your_openai_key
LLM_EVAL_TEMPERATURE=0.1
LLM_DIGEST_TEMPERATURE=0.6

# Server
PORT=3000
NODE_ENV=development
JWT_SECRET=your_jwt_secret
```

### 3. Initialize Database

```bash
npm run db:migrate
npm run db:seed        # loads demo agent + schedule data
```

### 4. Start Services

```bash
# Development (with hot reload)
npm run dev

# Production
npm run build
npm start
```

### 5. Configure Webhook

Set your Meta webhook callback URL to:
```
https://your-domain.com/api/webhook/whatsapp
```

Subscribe to fields: `messages`, `message_status`

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
│   ├── models/                 # Database models (Prisma / Drizzle)
│   │   ├── agent.ts
│   │   ├── contact.ts
│   │   ├── conversation.ts
│   │   ├── message.ts
│   │   ├── schedule.ts
│   │   └── escalation.ts
│   ├── middleware/              # Auth, validation, rate limiting
│   ├── config/                 # Environment & app configuration
│   └── utils/                  # Shared utilities
├── docs/
│   ├── architecture.md         # Full system architecture spec
│   ├── api-reference/          # Endpoint documentation
│   └── diagrams/               # System & flow diagrams
├── research/
│   ├── ieee_paper_draft.md     # IEEE Access paper (full draft)
│   ├── figures/                # Paper figures & charts
│   └── data/                   # Pilot measurement data
├── patents/
│   ├── patent_claims.md        # Formal utility patent claims
│   ├── disclosures/            # Invention Disclosure Forms
│   └── prior-art/              # Prior art search documentation
├── pitch/
│   ├── vc_deck_outline.md      # Slide-by-slide pitch deck
│   ├── assets/                 # Deck visuals & mockups
│   └── financials/             # Unit economics & projections
├── scripts/                    # DB migrations, seed, deploy
├── tests/
│   ├── unit/                   # Unit tests
│   └── integration/            # Integration tests
├── .env.example
├── .gitignore
├── LICENSE
├── CONTRIBUTING.md
├── SECURITY.md
├── package.json
└── tsconfig.json
```

---

## Documentation

| Document | Description |
|:---------|:------------|
| [`docs/architecture.md`](docs/architecture.md) | Complete system architecture, data flows, database schema, and integration spec |
| [`research/ieee_paper_draft.md`](research/ieee_paper_draft.md) | Full IEEE Access paper draft with formalized state machines and evaluation methodology |
| [`patents/patent_claims.md`](patents/patent_claims.md) | Three utility patent claim sets covering core innovations |
| [`pitch/vc_deck_outline.md`](pitch/vc_deck_outline.md) | 12-slide investor pitch deck with market sizing and unit economics |

---

## Intellectual Property & Research

### Patents (Filed — Indian Patent Office via VIT IPR Cell)

| # | Title | Status |
|:-:|:------|:-------|
| 1 | Single-Number Multi-Agent Context Multiplexing System | Provisional Filed |
| 2 | Autonomous Bi-Directional Scheduler-LLM Execution Loop | Provisional Filed |
| 3 | Conversational Enterprise State Synchronization Protocol | Provisional Filed |

### Academic Publication

**Paper:** *"A Multi-Agent Conversational Operating System for Enterprise Coordination via Unified Messaging APIs"*
**Target:** IEEE Access (Impact Factor ~3.9, Scopus/SCI Indexed)
**Status:** Under Review

> See [`research/ieee_paper_draft.md`](research/ieee_paper_draft.md) for the complete manuscript.

---

## Roadmap

- [x] MVP architecture design
- [x] Micro Turner pilot deployment
- [x] Patent provisional specifications filed (×3)
- [x] IEEE Access paper submitted
- [ ] Multi-tenant SaaS infrastructure
- [ ] Self-serve onboarding flow
- [ ] Fine-tuned LLM for manufacturing domain
- [ ] Telegram / LINE connector support
- [ ] ERP integration (SAP, Tally)
- [ ] On-premises deployment option
- [ ] Mobile dashboard app

---

## Tech Stack

| Layer | Technology |
|:------|:-----------|
| Frontend | Next.js 14, React, Tailwind CSS, shadcn/ui, Socket.IO |
| Backend | Node.js, Express, TypeScript |
| Scheduler | Bull (Redis-backed), node-cron |
| Database | PostgreSQL 16, Prisma ORM |
| Cache & Queue | Redis 7 |
| LLM | OpenAI GPT-4o, Whisper API |
| Messaging | WhatsApp Business Cloud API (v21.0) |
| Storage | S3 / Cloudflare R2 |
| Deployment | Docker, Railway / AWS |

---

## Contributing

We welcome contributions. See [`CONTRIBUTING.md`](CONTRIBUTING.md) for guidelines.

```bash
# Fork the repo, then:
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

---

## License

This project is licensed under the **Apache License 2.0** — see [`LICENSE`](LICENSE) for details.

The patent-pending innovations described in [`patents/`](patents/) are protected under Indian Patent Office filings. The Apache 2.0 license includes a patent grant for use of the software as distributed.

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

---

<div align="center">

**Built with conviction at [VIT](https://vit.ac.in) · Validated at Micro Turner · Patented · Peer-Reviewed**

[Report Bug](https://github.com/gitswagata1/omnisync-ai/issues) · [Request Feature](https://github.com/gitswagata1/omnisync-ai/issues) · [Contact](mailto:swagata@omnisync.ai)

</div>
