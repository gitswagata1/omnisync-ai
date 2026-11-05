# Invention Disclosure Form — IDF-001

## Single-Number Multi-Agent Context Multiplexing System

**Reference:** IDF-001 | **Filing Route:** Indian Patent Office via VIT IPR Cell

---

### 1. Title of Invention

*A System and Method for Multiplexing Multiple Organizational Agent Identities Over a Single Unified Messaging API Endpoint with Role-Based Context Isolation*

### 2. Field of Invention

Enterprise communication systems — specifically, a method and system for enabling multiple organizational agents to operate simultaneously through a single messaging API endpoint (such as WhatsApp Business Cloud API) while maintaining distinct agent identities, role-based access control, and contextual isolation between departments.

### 3. Background & Problem

Enterprise messaging platforms currently operate under one of two paradigms:

1. **One-number-per-agent:** Each employee uses their own phone number. Conversation history is lost when employees leave. No central audit trail. Clients receive messages from multiple unknown numbers.

2. **Shared inbox:** Multiple agents share one number, but messages appear as coming from a generic entity. No way to distinguish which agent sent what. No role-based visibility. No mechanism to prevent two agents from simultaneously engaging the same contact with conflicting information.

**Neither paradigm solves the core problem:** presenting a single organizational identity externally while internally maintaining agent-level provenance, role-based access, and department-scoped context isolation — all over a third-party API not designed for multi-tenant enterprise use.

### 4. Summary of Invention

The invention provides a context multiplexing layer between an enterprise's agent pool and a single messaging API endpoint:

**(a)** Each agent receives a composite identity tag `{Organization} | {Agent_ID} | {Role_ID}` embedded in outbound messages and indexed during inbound processing.

**(b)** A routing table maps external contacts to departments/agents, enabling automatic fan-out of inbound messages to all relevant parties.

**(c)** RBAC at the message level — agents in Department A cannot view or send to contacts exclusively mapped to Department B.

**(d)** Collision detection prevents two agents from simultaneously engaging the same external contact.

### 5. Detailed Description

#### 5.1 Agent Identity Registry

```
agent_record = {
    agent_id:     UUID v4 (globally unique),
    organization: "Micro Turner",
    user_name:    "Swagata",
    role:         "Purchase Manager",
    department:   "Purchase",
    role_tag:     f"{organization} | {user_name} | {department}",
    permissions:  set of permission tokens,
    auth_hash:    HMAC-SHA256(agent_id + role + department, system_secret)
}
```

The `auth_hash` is a cryptographic binding — it ensures role tags cannot be forged. Every outbound message dispatch verifies the hash before sending.

#### 5.2 Inbound Demultiplexer

```
FUNCTION demultiplex(inbound_message):
    sender = lookup_contact(message.sender_phone)
    
    IF sender NOT IN registry:
        CREATE contact, ASSIGN to default queue, NOTIFY admin
        RETURN
    
    departments = sender.department_bindings
    
    FOR EACH dept IN departments:
        agents = GET agents WHERE
            department = dept AND
            status = 'active' AND
            has_permission('view_contact', sender.id)
        
        FOR EACH agent IN agents:
            PUSH notification(agent, message, context_card(sender))
    
    STORE message WITH metadata:
        { sender, timestamp, body, routed_to: agents, thread_id }
```

#### 5.3 Outbound Multiplexer with Collision Detection

```
FUNCTION multiplex_outbound(agent, recipient, message):
    VERIFY agent.auth_hash IS VALID
    CHECK agent.has_permission('send', recipient.id)
    
    // Collision detection
    recent = GET messages WHERE
        recipient = recipient.id AND
        direction = 'outbound' AND
        timestamp > NOW() - INTERVAL t_window
    
    IF recent EXISTS AND recent.agent != agent:
        WARN agent: "Last contacted by {other_agent} at {time}."
        IF NOT agent.confirms: RETURN
    
    tagged_message = prepend(agent.role_tag, message)
    
    api_response = whatsapp_api.send(
        from: org_phone_number,    // single number
        to: recipient.phone,
        message: tagged_message
    )
    
    // Broadcast to peers
    FOR EACH peer IN recipient.mapped_agents WHERE peer != agent:
        NOTIFY peer: "Outbound by {agent.role_tag}: {preview}"
    
    LOG audit(agent, 'message_sent', recipient, hash(message))
```

#### 5.4 RBAC Permission Hierarchy

```
SUPER_ADMIN     → All contacts, all departments
DEPARTMENT_HEAD → Own department contacts + read-only on shared contacts
AGENT           → Only explicitly assigned contacts
VIEWER          → Read-only dashboard (for executive digests)
```

### 6. Claims

**Claim 1.** A computer-implemented method for multiplexing multiple distinct agent identities over a single unified messaging API endpoint, comprising: (a) maintaining an agent identity registry with composite identity tags; (b) generating HMAC-SHA256 authentication hashes per agent; (c) executing inbound demultiplexing based on contact-to-department mappings; (d) executing outbound multiplexing with hash verification, RBAC enforcement, and collision detection.

**Claim 2.** The method of claim 1, wherein collision detection queries recent outbound messages within a configurable time window and presents a warning upon detecting activity by a different agent.

**Claim 3.** The method of claim 1, further comprising real-time broadcast to all peer agents mapped to a contact upon any outbound message dispatch.

**Claim 4.** A system implementing claims 1-3, comprising: a processor, persistent storage for agent/contact/conversation/audit records, and a network interface for webhook callbacks and API requests.

**Claim 5.** The system of claim 4, wherein the messaging platform is WhatsApp Business Cloud API and the endpoint is a single verified business phone number.

### 7. Drawings Required

- **Fig. 1:** System architecture — single API endpoint with multiple agents
- **Fig. 2:** Inbound demultiplexing flowchart
- **Fig. 3:** Outbound multiplexing with collision detection flowchart
- **Fig. 4:** RBAC permission hierarchy diagram

### 8. Inventor(s)

- Swagata [Last Name], School of CSE, VIT Vellore

### 9. Prior Art Differentiation

See [`prior-art/analysis.md`](../prior-art/analysis.md) for the full competitive analysis. No existing platform provides cryptographically-secured agent identity multiplexing with collision detection and peer broadcast over a single third-party messaging endpoint.
