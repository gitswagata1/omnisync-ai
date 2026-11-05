# Patent Claims — OmniSync AI

> Three utility patent applications filed via VIT IPR Cell at the Indian Patent Office.
> Status: Provisional Specifications Filed | Priority Dates Secured

---

## Patent I: Single-Number Multi-Agent Context Multiplexing System

**Application Title:** *A System and Method for Multiplexing Multiple Organizational Agent Identities Over a Single Unified Messaging API Endpoint with Role-Based Context Isolation*

**Field:** Enterprise communication systems — multi-agent identity management over third-party messaging APIs.

### Claims

**Claim 1.** A computer-implemented method for multiplexing multiple distinct agent identities over a single unified messaging API endpoint, comprising:

(a) maintaining an agent identity registry wherein each agent is assigned a composite identity tag comprising an organization identifier, an agent identifier, and a role identifier;

(b) generating a cryptographic authentication hash for each agent identity using HMAC-SHA256 over the composite identity tag and a system secret;

(c) for each inbound message received at the single messaging endpoint, executing a demultiplexing function that routes the message to one or more agents based on a contact-to-department mapping table;

(d) for each outbound message, verifying the agent's cryptographic hash, enforcing role-based access permissions, executing collision detection against recent activity on the same contact, and dispatching the message through the single messaging endpoint with the agent's identity tag embedded.

**Claim 2.** The method of claim 1, wherein the collision detection comprises querying outbound messages to the same recipient within a configurable time window and, upon detecting activity by a different agent, presenting a warning notification with option to proceed or queue.

**Claim 3.** The method of claim 1, further comprising a real-time broadcast mechanism that notifies all agents mapped to a contact whenever any agent sends an outbound message to that contact, thereby maintaining cross-agent context awareness.

**Claim 4.** A system for multi-agent identity multiplexing over a single messaging API endpoint, comprising:

(a) a processor and memory storing instructions that, when executed, implement the method of claims 1-3;

(b) a persistent storage layer maintaining agent records, contact records, conversation threads, and an audit log;

(c) a network interface configured to receive webhook callbacks from and send API requests to a third-party messaging platform.

**Claim 5.** The system of claim 4, wherein the third-party messaging platform is the WhatsApp Business Cloud API and the single messaging endpoint is a single verified WhatsApp Business phone number.

### Key Novelty

No existing system provides cryptographically-secured agent identity multiplexing with collision detection and real-time peer broadcast over a single third-party messaging API endpoint. Existing shared inbox solutions (WATI, Freshdesk) provide multi-agent access but without: (i) HMAC-secured identity binding, (ii) deterministic collision detection, (iii) cross-agent broadcast on outbound messages, or (iv) RBAC enforced at the message dispatch level.

---

## Patent II: Autonomous Bi-Directional Scheduler-LLM Execution Loop

**Application Title:** *A Method and System for Autonomous Bi-Directional Communication Scheduling Integrating Deterministic Cron-Driven Execution with Probabilistic Language Model Feedback Loops for Enterprise Operations Management*

**Field:** Automated enterprise communication — hybrid deterministic-probabilistic scheduling systems.

### Claims

**Claim 1.** A computer-implemented method for autonomous bi-directional enterprise communication management, comprising:

(a) maintaining a plurality of scheduled communication tasks, each governed by a finite state machine with defined states and transition functions;

(b) upon a deterministic temporal trigger (cron expression evaluation), dispatching a message through a messaging API and transitioning the task to a waiting state with a configurable timeout;

(c) upon receiving a response to the dispatched message, invoking a large language model to evaluate the response for completeness, compliance, and entity content;

(d) based on the language model's evaluation, autonomously transitioning the task state machine to one of: a completion state, a retry state with a language-model-generated follow-up message, or an escalation state with supervisor notification;

(e) periodically aggregating outcomes from all task state machines and invoking the language model to synthesize executive intelligence reports.

**Claim 2.** The method of claim 1, wherein the finite state machine comprises states ENABLED, RUNNING, WAITING, SUCCESS, FAILED, ERROR, ESCALATED, PAUSED, and DELETED, with deterministic transitions triggered by system events and probabilistic transitions triggered by language model evaluations.

**Claim 3.** The method of claim 1, wherein the language model evaluation produces a structured output comprising: a completeness score (0.0-1.0), a compliance score (0.0-1.0), extracted entities, a decision (ACCEPT, CLARIFY, or REJECT), and a conditionally generated follow-up message.

**Claim 4.** The method of claim 1, wherein the executive intelligence synthesis comprises querying all task execution logs, message records, and escalation records within a configurable time range, computing operational metrics, and invoking the language model with these metrics to produce a natural-language executive briefing formatted for messaging platform delivery.

**Claim 5.** A system implementing the method of claims 1-4, comprising: a cron-driven scheduler engine, a message dispatch interface to a third-party messaging API, a webhook receiver for inbound messages, a large language model interface for response evaluation and report synthesis, a persistent state store for task state machines, and a notification subsystem for escalations and digest delivery.

### Key Novelty

No existing system combines: (i) deterministic cron-driven message scheduling with (ii) a probabilistic LLM feedback loop that evaluates responses and autonomously decides next actions, forming (iii) a closed bi-directional execution loop. Existing schedulers (cron, Airflow) cannot interpret responses. Existing chatbots (Intercom, Drift) cannot proactively initiate on temporal schedules. This patent covers the hybrid architecture.

### Formal State Machine Specification

```
FSM = (S, Σ, δ, s₀, F)

S  = {ENABLED, RUNNING, WAITING, SUCCESS, FAILED, ERROR, ESCALATED, PAUSED, DELETED}
s₀ = ENABLED
F  = {DELETED}

Σ_deterministic = {cron_fire, msg_sent, msg_failed, timeout, retry_available,
                   retry_exhaust, manual_pause, manual_resume, manual_delete}
Σ_probabilistic = {llm_accept, llm_clarify, llm_reject}

Bounded Liveness Invariant:
∀ schedule s ∈ S_active:
    s reaches {SUCCESS, ERROR, ESCALATED} within T_max
    where T_max = T_wait × (1 + max_retries) + T_escalation
```

---

## Patent III: Conversational Enterprise State Synchronization Protocol

**Application Title:** *A Protocol and System for Real-Time Synchronization of Conversational Interaction States Across Organizational Departments via Event-Driven Propagation Over Unified Messaging Channels*

**Field:** Enterprise communication coordination — cross-departmental state synchronization.

### Claims

**Claim 1.** A computer-implemented protocol for real-time synchronization of conversational interaction states across organizational departments, comprising:

(a) maintaining a contact context vector for each external entity, said vector comprising interaction metadata aggregated across all organizational departments;

(b) defining a taxonomy of synchronization events including inbound message, outbound message, entity update, commitment change, escalation, and status change, each with a defined propagation rule and priority level;

(c) upon occurrence of any synchronization event, computing the set of target departments and agents, constructing a delta update, and delivering the delta through at least one notification channel;

(d) for commitment change events, comparing the new commitment against existing commitments from other departments and raising a conflict flag when inconsistencies are detected.

**Claim 2.** The protocol of claim 1, wherein the contact context vector further comprises a natural-language context summary generated and maintained by a large language model, updated upon entity update, commitment change, and status change events.

**Claim 3.** The protocol of claim 1, further comprising a conflict resolution mechanism for concurrent send operations using optimistic locking, and for commitment conflicts using multi-department escalation with full context surfacing.

**Claim 4.** The protocol of claim 1, wherein delta updates are delivered simultaneously through a real-time WebSocket channel to online agents and through the messaging API to offline agents based on event priority level.

**Claim 5.** A system implementing the protocol of claims 1-4, comprising: a contact context vector store, a synchronization event processor, a propagation engine with multi-channel delivery, a conflict detection subsystem, and a large language model interface for context summary maintenance.

### Key Novelty

Existing dialogue state tracking systems model single-conversation, single-agent interactions. This patent covers a **multi-conversation, multi-agent, multi-department** synchronization protocol with: (i) a formal event taxonomy with priority-based propagation, (ii) automatic cross-departmental conflict detection for commitment changes, and (iii) LLM-maintained context summaries that provide any agent with instant full-relationship context.

### Formal Protocol Specification

```
Contact Context Vector:
Γ(c) = (c_id, org, β(c), {σ_D₁...σ_Dₙ}, T_unified, K, F_conflict, ψ)

Synchronization Events:
e = (type, c, D_source, a_source, t, payload, priority)
type ∈ {E_INBOUND, E_OUTBOUND, E_ENTITY, E_COMMITMENT, E_ESCALATION, E_STATUS}

Propagation:
propagate(e) = {a ∈ A : D(a) ∩ (β(e.c) \ {e.D_source}) ≠ ∅ ∧ view_permission(a, e.c)}

Conflict Detection:
conflict(e) = {k ∈ Γ(e.c).K : k.type = e.payload.type ∧ k.value ≠ e.payload.value}

Eventual Consistency: Guaranteed under at-least-once delivery + causal ordering + additive conflicts.
Bounded Latency: L_prop ≤ max(L_ws, L_msg) + L_db + L_llm(e.type)
```

---

## Filing Status

| Application | IPO Form | Status | Priority Date |
|:------------|:---------|:-------|:--------------|
| Patent I — Multi-Agent Multiplexing | Form 1 + Form 2 (Provisional) | Filed | [Date] |
| Patent II — Scheduler-LLM Loop | Form 1 + Form 2 (Provisional) | Filed | [Date] |
| Patent III — State Sync Protocol | Form 1 + Form 2 (Provisional) | Filed | [Date] |

**Filing Route:** Indian Patent Office via VIT IPR Cell
**Inventor:** Swagata [Last Name]
**Applicant:** Vellore Institute of Technology / OmniSync AI

**Next Steps:**
- Convert provisional to complete specifications within 12 months
- File examination request (Form 18)
- Consider PCT international filing (US, EU, Singapore) within priority window
