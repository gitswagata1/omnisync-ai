# System Architecture — OmniSync AI

> Full technical specification for the enterprise WhatsApp multi-agent operations platform.

---

## 1. System Overview

OmniSync AI is a three-tier application that operates as an intelligent coordination layer over the WhatsApp Business Cloud API.

```
┌───────────────────────────────────────────────────────────────────────┐
│                      PRESENTATION TIER                                │
│   Next.js 16 Dashboard + Socket.IO Real-Time + Auth Guard            │
│   ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌───────────────────────┐  │
│   │ Live Feed│ │ Scheduler │ │ Agent    │ │ Analytics & Digests   │  │
│   │ View     │ │ Manager   │ │ Manager  │ │                       │  │
│   └──────────┘ └───────────┘ └──────────┘ └───────────────────────┘  │
└───────────────────────────────┬───────────────────────────────────────┘
                                │ REST + WebSocket
┌───────────────────────────────┴───────────────────────────────────────┐
│                      APPLICATION TIER                                 │
│   Node.js + Express + TypeScript                                      │
│                                                                       │
│   ┌─────────────────┐  ┌────────────────┐  ┌──────────────────────┐  │
│   │ Webhook Handler │  │ Message Router │  │ Scheduler Engine     │  │
│   │ (Inbound)       │  │ (Outbound)     │  │ (Bull + node-cron)   │  │
│   └────────┬────────┘  └───────┬────────┘  └──────────┬───────────┘  │
│            │                   │                       │              │
│   ┌────────┴───────────────────┴───────────────────────┴───────────┐  │
│   │                    CORE SERVICES                               │  │
│   │  ┌──────────────┐ ┌─────────────┐ ┌────────────┐ ┌─────────┐  │  │
│   │  │ Agent        │ │ Context     │ │ LLM        │ │ Escalat.│  │  │
│   │  │ Identity     │ │ Sync (CESSP)│ │ Evaluator  │ │ Service │  │  │
│   │  └──────────────┘ └─────────────┘ └────────────┘ └─────────┘  │  │
│   └────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬───────────────────────────────────────┘
                                │
┌───────────────────────────────┴───────────────────────────────────────┐
│                      DATA TIER                                        │
│   PostgreSQL 16 │ Redis 7 │ S3-compatible Object Storage              │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Modules

### 2.1 Agent Identity Service

Manages the multi-agent identity layer over a single WhatsApp Business number.

**Agent Record:**
```typescript
interface Agent {
  id:          string;        // UUID v4
  company:     string;        // "Micro Turner"
  userName:    string;        // "Swagata"
  role:        string;        // "Purchase Manager"
  department:  string;        // "Purchase"
  phone:       string;        // personal number for internal routing
  roleTag:     string;        // computed: "Micro Turner | Swagata | Purchase"
  permissions: Permission[];
  authHash:    string;        // HMAC-SHA256(id + role + department, systemSecret)
  status:      'active' | 'inactive';
}
```

**Identity verification:** Every outbound message dispatch verifies the agent's `authHash` before sending. Role tags cannot be spoofed — the hash binds the agent's identity to the system secret.

**RBAC hierarchy:**
```
SUPER_ADMIN      → View/send to ALL contacts across ALL departments
DEPARTMENT_HEAD  → View/send within department; read-only on shared contacts
AGENT            → View/send only to assigned contacts
VIEWER           → Read-only dashboard access (for VP digests)
```

### 2.2 Webhook Inbound Handler

Receives all incoming WhatsApp messages from Meta's webhook infrastructure.

**Pipeline:**
```
Webhook POST → Signature Verification → Payload Parse → Media Download
    → Contact Lookup → Department Routing → DB Store → LLM Analysis
    → Agent Notification (WebSocket + WhatsApp forward) → Escalation Check
```

**Signature verification:** Every webhook payload is verified using HMAC-SHA256 against the `WHATSAPP_APP_SECRET` via the `X-Hub-Signature-256` header. Unverified payloads are rejected with 403.

**LLM analysis output (per inbound message):**
```typescript
interface MessageAnalysis {
  intent:         string;     // "delivery_reschedule", "status_update", etc.
  urgency:        number;     // 1-5 scale
  entities:       Entity[];   // { type: "po_number", value: "MT-2026-4521" }
  suggestedReply: string;
  notifyAgents:   string[];   // agent IDs requiring notification
}
```

### 2.3 Outbound Message Router

Dispatches messages through the WhatsApp Cloud API on behalf of tagged agents.

**Pre-dispatch checks:**
1. Verify agent `authHash`
2. Verify `send_permission(agent, contact)`
3. Collision detection: check for outbound activity to same contact within `t_window` (default: 4 hours)
4. If collision detected → warn agent, require confirmation
5. Dispatch via API with role tag embedded
6. Broadcast message preview to all peer agents in `V(contact)`

**Template vs. session messages:**
- Within 24-hour conversation window → free-form session messages
- Outside 24-hour window → pre-approved template messages only (Meta requirement)

### 2.4 Scheduler Engine

Manages all recurring automated communications with a full state machine lifecycle.

**State machine:**
```
          create
            │
            ▼
       ┌─────────┐
       │ ENABLED  │◄──────────── resume
       └────┬─────┘
            │
   ┌────────┼──────────┐
   │        │          │
execute   pause     delete
   │        │          │
   ▼        ▼          ▼
┌────────┐ ┌──────┐ ┌─────────┐
│RUNNING │ │PAUSED│ │ DELETED │
└──┬─────┘ └──────┘ └─────────┘
   │
   ├── msg_sent ──► WAITING ──┬── response + llm_accept ──► SUCCESS ──► ENABLED
   │                          ├── response + llm_clarify ──► WAITING (follow-up sent)
   │                          ├── response + llm_reject  ──► FAILED
   │                          └── timeout ─────────────────► ESCALATED
   │
   └── msg_failed ──► FAILED ──┬── retry_available ──► RUNNING
                               └── retry_exhaust  ──► ERROR ──► PAUSED + admin alert
```

**Implementation:** Bull queue (Redis-backed) for reliable job execution. Each schedule is a repeatable Bull job with:
- Cron expression for timing
- Configurable retry policy (max retries, exponential backoff)
- Response timeout timer
- Escalation chain configuration

**Pre-configured templates for manufacturing:**

| Schedule | Cron | Purpose |
|:---------|:-----|:--------|
| Daily Maintenance Check | `0 8 * * 1-6` | Machine status request to maintenance head |
| Daily To-Do Push | `0 8 * * 1-6` | Auto-generated task list to VP |
| EOD Summary | `0 18 * * 1-6` | AI-generated daily digest to VP |
| Weekly Purchase Wrap-up | `0 9 * * 1` | All vendor interactions + PO statuses |
| Monthly Executive Report | `0 9 1 * *` | KPIs and analytics to MD |
| Vendor Follow-up | Dynamic | Triggered when PO exceeds expected delivery |
| AMC Renewal Reminder | 30 days before | Equipment maintenance contract renewal |

### 2.5 Context Synchronization Service (CESSP)

Eliminates cross-departmental information silos through event-driven state propagation.

**Contact Context Vector (CCV):**
```typescript
interface ContactContextVector {
  contactId:        string;
  organization:     string;         // "Mercedes-Benz"
  departmentBindings: string[];     // ["Purchase", "Sales", "Quality"]
  departmentStates: Record<string, DepartmentState>;
  unifiedTimeline:  InteractionEvent[];
  activeCommitments: Commitment[];
  conflictFlags:    ConflictFlag[];
  contextSummary:   string;         // LLM-maintained natural language summary
}
```

**Synchronization event types:**

| Event | Trigger | Priority | Propagation |
|:------|:--------|:---------|:------------|
| `E_INBOUND` | External contact sends message | IMMEDIATE | All bound departments |
| `E_OUTBOUND` | Agent sends to external contact | IMMEDIATE | All OTHER bound departments |
| `E_ENTITY` | LLM extracts/updates entity | HIGH | All departments |
| `E_COMMITMENT` | Commitment detected/changed | CRITICAL | All departments + conflict check |
| `E_ESCALATION` | Escalation triggered | CRITICAL | All departments + supervisory chain |
| `E_STATUS` | Contact status change | NORMAL | All departments |

**Conflict detection:** When a `E_COMMITMENT` event fires, the system checks existing commitments from other departments. If values differ (e.g., Purchase committed Week 47, Sales committed Week 48), a conflict flag is raised to both department heads with full context. The system never auto-resolves — it surfaces conflicts for human decision.

### 2.6 LLM Engine

Handles all natural language processing through OpenAI GPT-4o.

**Use cases:**

| Function | Temperature | Schema-enforced | Trigger |
|:---------|:------------|:----------------|:--------|
| Intent classification | 0.1 | Yes | Every inbound message |
| Response evaluation | 0.1 | Yes | Every reply to a scheduled message |
| Follow-up generation | 0.3 | No | When evaluation returns CLARIFY |
| Executive digest | 0.6 | No | Scheduled (daily/weekly/monthly) |
| Context summary update | 0.3 | No | On ENTITY/COMMITMENT/STATUS events |
| Smart reply suggestions | 0.4 | Yes | Per inbound message (2-3 options) |

---

## 3. Data Flows

### Flow A: Inbound Message from Client

```
Mercedes sends WhatsApp message to Micro Turner business number
  → Meta Cloud API delivers webhook POST to /api/webhook/whatsapp
  → Verify X-Hub-Signature-256 against app secret
  → Parse payload: sender, message type, body, media
  → If audio: download via Graph API → transcribe via Whisper
  → Lookup contact: Mercedes → departments: [Purchase, Sales]
  → Store in messages table with conversation thread
  → LLM analysis: intent, urgency, entities, suggested reply
  → Context Sync: broadcast to all Purchase + Sales agents
     ├── Dashboard: WebSocket push (real-time)
     ├── Swagata's WhatsApp: forwarded summary
     └── Amit's WhatsApp: forwarded summary
  → Dashboard shows suggested replies for agent to pick/edit/send
```

### Flow B: Scheduled Maintenance Reminder with Escalation

```
Cron fires at 8:00 AM
  → Scheduler picks up: "Daily Maintenance Check - CNC Bay 3"
  → Build template message with variables
  → POST to WhatsApp Cloud API → send to Rajesh
  → Log execution (status: success), start 2-hour response timer
  │
  ├── Rajesh replies "Done, all clear" within 2 hours
  │   → LLM evaluates: completeness=0.9, compliance=0.95 → ACCEPT
  │   → Mark SUCCESS, update context card
  │
  └── No reply after 2 hours
      → Timeout → ESCALATED
      → Send escalation template to VP's WhatsApp
      → Log in escalations table
      → Dashboard: flag as OVERDUE
```

### Flow C: Auto-Generated Executive Digest

```
Cron fires at 6:00 PM
  → Query all messages, schedule_logs, escalations from today
  → Compute metrics: completed, pending, escalated, by department
  → Feed to LLM with digest prompt + format spec
  → LLM generates formatted WhatsApp-readable summary
  → Send via template to VP's WhatsApp
  → Store digest in DB for dashboard archive
```

---

## 4. Database Schema

```sql
-- Agent identities
CREATE TABLE agents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company         VARCHAR(100) NOT NULL DEFAULT 'Micro Turner',
    user_name       VARCHAR(100) NOT NULL,
    role            VARCHAR(100),
    department      VARCHAR(100),
    personal_phone  VARCHAR(20),
    role_tag        VARCHAR(255) GENERATED ALWAYS AS
                    (company || ' | ' || user_name || ' | ' || department) STORED,
    permissions     JSONB DEFAULT '[]',
    auth_hash       VARCHAR(64) NOT NULL,
    status          VARCHAR(20) DEFAULT 'active',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- External contacts
CREATE TABLE contacts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone           VARCHAR(20) UNIQUE NOT NULL,
    name            VARCHAR(200),
    organization    VARCHAR(200),
    contact_type    VARCHAR(50),
    departments     TEXT[],
    assigned_agents UUID[],
    context_card    JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation threads
CREATE TABLE conversations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id      UUID REFERENCES contacts(id),
    department      VARCHAR(100),
    status          VARCHAR(50) DEFAULT 'active',
    last_message_at TIMESTAMPTZ,
    message_count   INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id),
    wa_message_id   VARCHAR(100),
    direction       VARCHAR(10) NOT NULL,
    sender_agent_id UUID REFERENCES agents(id),
    sender_phone    VARCHAR(20),
    message_type    VARCHAR(20),
    body            TEXT,
    media_url       VARCHAR(500),
    transcript      TEXT,
    llm_analysis    JSONB,
    delivery_status VARCHAR(20),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled tasks
CREATE TABLE schedules (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name              VARCHAR(255) NOT NULL,
    schedule_type     VARCHAR(50),
    cron_expression   VARCHAR(100) NOT NULL,
    recipient_phone   VARCHAR(20) NOT NULL,
    recipient_name    VARCHAR(200),
    agent_id          UUID REFERENCES agents(id),
    message_template  VARCHAR(100),
    template_vars     JSONB DEFAULT '{}',
    status            VARCHAR(20) DEFAULT 'enabled',
    retry_policy      JSONB DEFAULT '{"max_retries": 3, "backoff_seconds": 300}',
    escalation_config JSONB,
    last_run_at       TIMESTAMPTZ,
    next_run_at       TIMESTAMPTZ,
    run_count         INTEGER DEFAULT 0,
    error_count       INTEGER DEFAULT 0,
    created_by        UUID REFERENCES agents(id),
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Schedule execution logs
CREATE TABLE schedule_logs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id         UUID REFERENCES schedules(id),
    executed_at         TIMESTAMPTZ DEFAULT NOW(),
    status              VARCHAR(20),
    wa_message_id       VARCHAR(100),
    error_message       TEXT,
    response_received   BOOLEAN DEFAULT FALSE,
    response_at         TIMESTAMPTZ,
    llm_evaluation      JSONB
);

-- Escalations
CREATE TABLE escalations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trigger_type    VARCHAR(50),
    source_id       UUID,
    escalated_to    VARCHAR(20),
    escalation_msg  TEXT,
    status          VARCHAR(20),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ
);

-- Audit trail
CREATE TABLE audit_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_agent_id  UUID,
    action          VARCHAR(100),
    target_type     VARCHAR(50),
    target_id       UUID,
    metadata        JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(created_at);
CREATE INDEX idx_schedules_status ON schedules(status);
CREATE INDEX idx_schedules_next_run ON schedules(next_run_at);
CREATE INDEX idx_contacts_phone ON contacts(phone);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);
```

---

## 5. WhatsApp Cloud API Integration

### Endpoints Used

| Operation | Endpoint | Method |
|:----------|:---------|:-------|
| Send message | `/v21.0/{phone_number_id}/messages` | POST |
| Download media | `/v21.0/{media_id}` | GET |
| Mark as read | `/v21.0/{phone_number_id}/messages` | PUT |
| Receive messages | Webhook callback | POST (from Meta) |
| Delivery status | Webhook callback | POST (from Meta) |

### Approved Message Templates

| Template | Variables | Use Case |
|:---------|:----------|:---------|
| `maintenance_daily_reminder` | machine_name, date | Daily maintenance status request |
| `po_status_update` | po_number, update, status, date, agent | Purchase order notifications |
| `executive_daily_digest` | recipient_name, date, digest_body | Automated daily summary |
| `escalation_no_response` | person_name, task, original_time | No-response escalation |
| `vendor_followup` | vendor_name, subject, reference, agent | Vendor follow-up |

---

## 6. Security

| Concern | Implementation |
|:--------|:---------------|
| Webhook authenticity | HMAC-SHA256 signature verification on every inbound webhook |
| Agent identity | HMAC-SHA256 hash binding agent ID + role + department to system secret |
| API authentication | JWT tokens (RS256) with role-based claims |
| Data at rest | PostgreSQL with encrypted storage; S3 server-side encryption |
| RBAC | Permission matrix enforced at service layer before every message operation |
| Audit trail | Every action logged with actor, timestamp, target, and metadata |
| Rate limiting | Express rate limiter per agent + global webhook rate limit |
