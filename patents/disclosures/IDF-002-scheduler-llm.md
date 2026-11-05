# Invention Disclosure Form — IDF-002

## Autonomous Bi-Directional Scheduler-LLM Execution Loop

**Reference:** IDF-002 | **Filing Route:** Indian Patent Office via VIT IPR Cell

---

### 1. Title of Invention

*A Method and System for Autonomous Bi-Directional Communication Scheduling Integrating Deterministic Cron-Driven Execution with Probabilistic Language Model Feedback Loops for Enterprise Operations Management*

### 2. Field of Invention

Automated enterprise communication — a hybrid architecture combining deterministic time-based scheduling with probabilistic NLP to create an autonomous closed-loop communication system.

### 3. Background & Problem

Two categories of existing systems fail to solve this:

1. **Deterministic schedulers** (cron, Airflow, Celery Beat): Execute predefined actions at predefined times. Cannot interpret responses, adapt based on context, or generate dynamic content. A cron job sends a reminder but cannot understand the reply or decide if the response is adequate.

2. **LLM-powered chatbots** (Intercom, Drift): Understand and generate language but are purely reactive. No autonomous temporal awareness, no proactive initiation, no persistent state machines for multi-step workflows.

**No existing system combines both** — a scheduler that autonomously initiates on temporal patterns AND an LLM that evaluates responses and decides next actions, forming a closed loop.

### 4. Summary of Invention

**(a)** A scheduler engine manages recurring tasks, each governed by a finite state machine (FSM): `ENABLED → RUNNING → WAITING → {SUCCESS | FAILED | ESCALATED}`.

**(b)** Upon each execution, a message is dispatched and the FSM enters `WAITING` with a configurable timeout.

**(c)** When a response arrives, an LLM evaluates completeness, compliance, and extracts entities.

**(d)** Based on evaluation: mark complete, send LLM-generated follow-up, or escalate to supervisor.

**(e)** Periodically, the LLM aggregates all outcomes into executive intelligence reports.

### 5. Detailed Description

#### 5.1 Finite State Machine Specification

```
FSM = (S, Σ, δ, s₀, F)

States S = {ENABLED, RUNNING, WAITING, SUCCESS, FAILED, ERROR, ESCALATED, PAUSED, DELETED}
Initial state s₀ = ENABLED
Terminal state F = {DELETED}

Input alphabet Σ = Σ_deterministic ∪ Σ_probabilistic

Σ_deterministic = {cron_fire, msg_sent, msg_failed, timeout, retry_available,
                   retry_exhaust, manual_pause, manual_resume, manual_delete}

Σ_probabilistic = {llm_accept, llm_clarify, llm_reject}
```

#### 5.2 Transition Function δ

| Current State | Input | Next State | Action |
|:---|:---|:---|:---|
| ENABLED | cron_fire | RUNNING | Initiate message dispatch |
| RUNNING | msg_sent | WAITING | Start response timer T_wait |
| RUNNING | msg_failed | FAILED | Log error, check retry budget |
| WAITING | response ∧ llm_accept | SUCCESS | Log completion, update CCV |
| WAITING | response ∧ llm_clarify | WAITING | Send LLM follow-up, reset timer |
| WAITING | response ∧ llm_reject | FAILED | Log non-compliance |
| WAITING | timeout | ESCALATED | Notify supervisor |
| FAILED | retry_available | RUNNING | Retry with backoff 2^k · t_base |
| FAILED | retry_exhaust | ERROR | Alert admin, auto-pause |
| ERROR | manual_resume | ENABLED | Reset counters |
| ESCALATED | response ∧ llm_accept | SUCCESS | Resolve escalation |
| ESCALATED | timeout | ERROR | Double-escalation |
| ENABLED | manual_pause | PAUSED | Suspend cron |
| PAUSED | manual_resume | ENABLED | Resume cron |
| * | manual_delete | DELETED | Terminal |

#### 5.3 LLM Response Evaluator

```
FUNCTION evaluate_response(schedule, original_message, response):
    evaluation = LLM.generate({
        task_type: schedule.type,
        original: original_message,
        expected: schedule.criteria,
        received: response.body
    }) → {
        completeness: float [0, 1],
        compliance:   float [0, 1],
        entities:     [{type, value}],
        decision:     ACCEPT | CLARIFY | REJECT,
        follow_up:    string | null
    }
    
    // Decision thresholds (configurable per task type)
    IF completeness >= θ_comp AND compliance >= θ_compl → ACCEPT
    IF completeness < θ_comp AND compliance >= θ_reject → CLARIFY
    IF compliance < θ_reject → REJECT
    
    EXECUTE state transition based on decision
    RETURN evaluation
```

#### 5.4 Executive Intelligence Synthesizer

```
FUNCTION generate_digest(time_range, recipient_role):
    data = {
        executions: GET schedule_logs IN time_range,
        messages:   GET messages IN time_range,
        escalations: GET escalations IN time_range
    }
    
    metrics = COMPUTE {
        total_scheduled, completed_on_time, escalated,
        avg_response_time, overdue_items, dept_breakdown
    }
    
    digest = LLM.synthesize(metrics, notable_events, format_for(recipient_role))
    SEND via messaging_api TO recipient
    LOG digest
```

#### 5.5 Bounded Liveness Invariant

Every active schedule reaches a terminal state within deterministic time:

```
∀ schedule s ∈ S_active:
    s reaches {SUCCESS, ERROR, ESCALATED} within T_max
    where T_max = T_wait × (1 + max_retries) + T_escalation
```

#### 5.6 The Closed Loop

```
Schedule → Dispatch → Wait → Evaluate (LLM) → Decide → {Complete | Follow-up | Escalate}
                                                              │
                                              Aggregate all outcomes
                                                              │
                                                    Generate Digest → Deliver
```

### 6. Claims

**Claim 1.** A method for autonomous bi-directional enterprise communication management comprising: (a) scheduled tasks governed by finite state machines; (b) cron-triggered message dispatch with timeout-based waiting; (c) LLM-driven response evaluation for completeness and compliance; (d) autonomous state transitions based on evaluation; (e) periodic LLM synthesis of executive reports.

**Claim 2.** The method of claim 1, wherein the FSM comprises 9 states with deterministic and probabilistic transition inputs.

**Claim 3.** The method of claim 1, wherein LLM evaluation produces structured output: completeness score, compliance score, entities, decision, and conditional follow-up.

**Claim 4.** The method of claim 1, wherein executive synthesis aggregates task logs, messages, and escalations and invokes the LLM to produce formatted briefings.

**Claim 5.** A system implementing claims 1-4 comprising: scheduler engine, messaging API interface, webhook receiver, LLM interface, persistent state store, and escalation subsystem.

### 7. Drawings Required

- **Fig. 1:** FSM state diagram (all 9 states and transitions)
- **Fig. 2:** LLM evaluation pipeline
- **Fig. 3:** Closed bi-directional loop diagram
- **Fig. 4:** Executive digest generation data flow

### 8. Inventor(s)

- Swagata [Last Name], School of CSE, VIT Vellore
