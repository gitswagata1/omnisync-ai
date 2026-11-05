# Invention Disclosure Form — IDF-003

## Conversational Enterprise State Synchronization Protocol (CESSP)

**Reference:** IDF-003 | **Filing Route:** Indian Patent Office via VIT IPR Cell

---

### 1. Title of Invention

*A Protocol and System for Real-Time Synchronization of Conversational Interaction States Across Organizational Departments via Event-Driven Propagation Over Unified Messaging Channels*

### 2. Field of Invention

Enterprise communication coordination — a protocol for automatically propagating external conversational interaction states across multiple internal departments in real time.

### 3. Background & Problem

In multi-departmental enterprises, a single external entity (client, vendor) interacts with multiple departments. For example, Mercedes communicates with Purchase (orders), Sales (pricing), Quality (specs), and Logistics (delivery).

Each department maintains its own record — often in personal chats or siloed CRMs. When a client communicates a critical update to one department, others remain unaware, causing:
- **Duplicate outreach** — two departments call the same client
- **Contradictory commitments** — Sales confirms one date, Logistics has another
- **Lost context** — new team members lack historical cross-department interaction

No existing system provides a protocol-level solution for automatically propagating conversational state changes across departments over a unified messaging channel.

### 4. Summary of Invention

**(a)** Each external contact is modeled as a stateful entity with a **Contact Context Vector (CCV)** spanning all departmental interactions.

**(b)** Six synchronization event types trigger cross-departmental propagation.

**(c)** An event-driven propagation engine computes affected departments/agents, constructs delta updates, and delivers them via multiple channels.

**(d)** A conflict resolution mechanism detects contradictory commitments across departments.

### 5. Detailed Description

#### 5.1 Contact Context Vector (CCV)

```
Γ(c) = {
    contact_id:          UUID,
    organization:        "Mercedes-Benz",
    department_bindings: {Purchase, Sales, Quality},
    
    department_states: {
        Purchase: {
            last_interaction: timestamp,
            last_agent:       agent_id,
            active_threads:   [thread_ids],
            open_items:       [{entity, status}],
            sentiment:        float
        },
        Sales: { ... },
        Quality: { ... }
    },
    
    unified_timeline:    chronological list of ALL interactions across ALL depts,
    active_commitments:  [{type, value, dept, agent, date, status}],
    conflict_flags:      [{type, depts_involved, description}],
    context_summary:     LLM-generated natural language summary
}
```

#### 5.2 Synchronization Event Taxonomy

| Type | Trigger | Priority | Propagation Target |
|:-----|:--------|:---------|:-------------------|
| `E_INBOUND` | External contact sends message | IMMEDIATE | ALL bound departments |
| `E_OUTBOUND` | Agent sends to contact | IMMEDIATE | All OTHER bound departments |
| `E_ENTITY` | LLM extracts/updates entity | HIGH | All departments |
| `E_COMMITMENT` | Commitment detected/changed | CRITICAL | All departments + conflict check |
| `E_ESCALATION` | Escalation triggered | CRITICAL | All departments + supervisors |
| `E_STATUS` | Contact status change | NORMAL | All departments |

#### 5.3 Propagation Engine

```
FUNCTION propagate(event):
    contact = GET contact(event.contact_id)
    source = event.source_department
    
    targets = contact.department_bindings \ {source}
    agents = []
    
    FOR EACH dept IN targets:
        dept_agents = GET agents WHERE
            department = dept AND
            has_permission('view_contact', contact.id) AND
            status = 'active'
        agents.extend(dept_agents)
    
    delta = {
        event_type: event.type,
        source:     {department: source, agent: event.agent},
        timestamp:  event.timestamp,
        payload:    event.payload,
        context:    contact.context_summary
    }
    
    // Conflict detection for commitment events
    IF event.type == 'E_COMMITMENT':
        existing = GET commitments(contact, event.payload.type)
        IF existing AND existing.value != event.payload.value:
            flag = {
                type: 'commitment_conflict',
                departments: [existing.department, source],
                description: f"{source} committed {event.payload.value} but
                              {existing.department} committed {existing.value}"
            }
            RAISE conflict_flag(contact, flag)
            delta.conflict = flag
    
    // Multi-channel delivery
    FOR EACH agent IN agents:
        WEBSOCKET.emit(agent.session, 'sync_event', delta)
        
        IF event.priority IN ('CRITICAL', 'HIGH', 'IMMEDIATE'):
            SEND whatsapp_notification(agent.phone, format(delta))
    
    // Update CCV
    UPDATE_CCV(contact, event)
    
    IF event.type IN ('E_ENTITY', 'E_COMMITMENT', 'E_STATUS'):
        contact.context_summary = LLM.summarize(
            contact.unified_timeline, contact.active_commitments
        )
```

#### 5.4 Conflict Resolution Protocol

| Conflict Type | Trigger | Resolution |
|:---|:---|:---|
| **Concurrent Send** | Two agents message same contact simultaneously | Optimistic lock — first dispatch wins; second agent warned |
| **Commitment Conflict** | Departments make different commitments | Flag to both dept heads + supervisors; NO auto-resolve |
| **Stale Context** | Agent acts on outdated info | Pre-send CCV check; show delta since last viewed |

#### 5.5 Formal Properties

**Eventual Consistency:** All agents in V(c) observe consistent Γ(c) after processing all events, given: (i) at-least-once delivery, (ii) causal ordering per contact, (iii) additive conflict flags.

**Bounded Propagation Latency:** `L_prop ≤ max(L_ws, L_msg) + L_db + L_llm(e.type)`

### 6. Claims

**Claim 1.** A protocol for real-time synchronization of conversational states across departments, comprising: (a) contact context vectors with cross-department metadata; (b) a taxonomy of 6 synchronization event types with priority-based propagation; (c) event-driven delta computation and multi-channel delivery; (d) conflict detection for commitment changes.

**Claim 2.** The protocol of claim 1, wherein the CCV includes an LLM-maintained natural language context summary updated on entity, commitment, and status events.

**Claim 3.** The protocol of claim 1, further comprising conflict resolution: optimistic locking for concurrent sends, multi-department escalation for commitment conflicts.

**Claim 4.** The protocol of claim 1, wherein deltas are delivered via WebSocket (online agents) and messaging API (offline agents) based on priority.

**Claim 5.** A system implementing claims 1-4 comprising: CCV store, event processor, propagation engine, conflict detector, and LLM interface for summary maintenance.

### 7. Drawings Required

- **Fig. 1:** Contact Context Vector structure diagram
- **Fig. 2:** Synchronization event propagation flow
- **Fig. 3:** Conflict detection and resolution flowchart
- **Fig. 4:** Multi-department visibility model

### 8. Inventor(s)

- Swagata [Last Name], School of CSE, VIT Vellore
