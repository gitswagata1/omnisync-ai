# API Reference — OmniSync AI

> All REST API endpoints. Base URL: `http://localhost:3000/api`

---

## Authentication

All endpoints except `/webhook` and `/health` require a JWT Bearer token.

```
Authorization: Bearer <jwt_token>
```

JWT payload contains: `{ agent_id, role, department, permissions }`.

---

## Health Check

### `GET /health`

Returns server status. No authentication required.

**Response `200`:**
```json
{
  "status": "ok",
  "timestamp": "2026-11-05T10:30:00.000Z"
}
```

---

## Webhook

### `GET /api/webhook/whatsapp`

Webhook verification endpoint (called by Meta during setup).

**Query Parameters:**

| Param | Type | Description |
|:------|:-----|:------------|
| `hub.mode` | string | Must be `subscribe` |
| `hub.verify_token` | string | Must match `WHATSAPP_VERIFY_TOKEN` |
| `hub.challenge` | string | Challenge string to echo back |

**Response `200`:** Returns the challenge string.

### `POST /api/webhook/whatsapp`

Receives inbound messages and status updates from Meta.

**Headers:**
- `X-Hub-Signature-256` — HMAC-SHA256 signature for payload verification.

**Response `200`:** Always returns 200 to acknowledge receipt.

---

## Agents

### `GET /api/agents`

List all agents. Filtered by requester's RBAC permissions.

**Response `200`:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "company": "Micro Turner",
    "userName": "Swagata",
    "role": "Purchase Manager",
    "department": "Purchase",
    "roleTag": "Micro Turner | Swagata | Purchase",
    "status": "active",
    "createdAt": "2026-11-01T08:00:00.000Z"
  }
]
```

### `POST /api/agents`

Register a new agent. Requires `SUPER_ADMIN` permission.

**Request Body:**
```json
{
  "userName": "Amit",
  "role": "Sales Lead",
  "department": "Sales",
  "personalPhone": "+919876543211",
  "permissions": ["send_client", "view_all_sales"]
}
```

**Response `201`:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "roleTag": "Micro Turner | Amit | Sales",
  "authHash": "a1b2c3..."
}
```

---

## Messages

### `POST /api/messages/send`

Send an outbound message on behalf of an agent. Enforces RBAC, collision detection, and peer broadcast.

**Request Body:**
```json
{
  "agentId": "550e8400-e29b-41d4-a716-446655440001",
  "contactPhone": "+4915112345678",
  "messageType": "text",
  "body": "Your PO #MT-2026-4521 has been dispatched.",
  "templateName": null,
  "templateVars": null
}
```

**Response `200`:**
```json
{
  "waMessageId": "wamid.abc123",
  "deliveryStatus": "sent",
  "broadcastedTo": ["550e8400-e29b-41d4-a716-446655440002"],
  "collisionWarning": null
}
```

**Response `409` (collision detected):**
```json
{
  "warning": "Last contacted by Amit (Sales) at 14:32. Proceed?",
  "lastAgent": "Amit",
  "lastTimestamp": "2026-11-05T14:32:00.000Z",
  "confirmUrl": "/api/messages/send?force=true"
}
```

### `GET /api/messages/:conversationId`

Get all messages in a conversation thread. RBAC-filtered.

**Query Parameters:**

| Param | Type | Default | Description |
|:------|:-----|:--------|:------------|
| `limit` | number | 50 | Messages per page |
| `offset` | number | 0 | Pagination offset |

**Response `200`:**
```json
{
  "conversationId": "...",
  "contact": { "name": "Hans Mueller", "organization": "Mercedes-Benz" },
  "messages": [
    {
      "id": "...",
      "direction": "outbound",
      "senderAgent": { "userName": "Swagata", "roleTag": "Micro Turner | Swagata | Purchase" },
      "body": "PO #MT-2026-4521 has been dispatched.",
      "messageType": "text",
      "deliveryStatus": "read",
      "llmAnalysis": null,
      "createdAt": "2026-11-05T10:15:00.000Z"
    },
    {
      "id": "...",
      "direction": "inbound",
      "senderAgent": null,
      "body": "Please revise delivery to Week 48.",
      "messageType": "text",
      "deliveryStatus": null,
      "llmAnalysis": {
        "intent": "delivery_reschedule",
        "urgency": 3,
        "entities": [{ "type": "week", "value": "48" }],
        "suggestedReply": "Acknowledged. Delivery revised to Week 48."
      },
      "createdAt": "2026-11-05T10:22:00.000Z"
    }
  ],
  "total": 2
}
```

---

## Contacts

### `GET /api/contacts`

List contacts visible to the requesting agent's department.

**Response `200`:**
```json
[
  {
    "id": "660e8400-...",
    "phone": "+4915112345678",
    "name": "Hans Mueller",
    "organization": "Mercedes-Benz",
    "contactType": "client",
    "departments": ["Purchase", "Sales", "Quality"],
    "contextSummary": "Active PO #MT-2026-4521. Delivery revised to Week 48 per client request on Nov 5."
  }
]
```

### `POST /api/contacts`

Create a new contact with department bindings.

**Request Body:**
```json
{
  "phone": "+4915112345678",
  "name": "Hans Mueller",
  "organization": "Mercedes-Benz",
  "contactType": "client",
  "departments": ["Purchase", "Sales", "Quality"],
  "assignedAgents": ["550e8400-..."]
}
```

### `GET /api/contacts/:id/context`

Get the full Contact Context Vector (CCV) for a contact.

**Response `200`:**
```json
{
  "contactId": "660e8400-...",
  "organization": "Mercedes-Benz",
  "departmentBindings": ["Purchase", "Sales", "Quality"],
  "departmentStates": {
    "Purchase": {
      "lastInteraction": "2026-11-05T10:22:00.000Z",
      "lastAgent": "Swagata",
      "openItems": [{ "entity": "PO #MT-2026-4521", "status": "delivery_revised" }],
      "sentiment": 0.72
    }
  },
  "activeCommitments": [
    { "type": "delivery_date", "value": "Week 48", "department": "Purchase", "agent": "Swagata" }
  ],
  "conflictFlags": [],
  "contextSummary": "Active PO with delivery revised to Week 48."
}
```

---

## Schedules

### `GET /api/schedules`

List all schedules. RBAC-filtered.

**Response `200`:**
```json
[
  {
    "id": "770e8400-...",
    "name": "Daily Maintenance Check — CNC Bay 3",
    "scheduleType": "maintenance",
    "cronExpression": "0 8 * * 1-6",
    "recipientName": "Rajesh (Maintenance)",
    "status": "enabled",
    "lastRunAt": "2026-11-05T08:00:00.000Z",
    "nextRunAt": "2026-11-06T08:00:00.000Z",
    "runCount": 42,
    "errorCount": 1
  }
]
```

### `POST /api/schedules`

Create a new schedule.

**Request Body:**
```json
{
  "name": "Daily Maintenance Check — CNC Bay 3",
  "scheduleType": "maintenance",
  "cronExpression": "0 8 * * 1-6",
  "recipientPhone": "+919876500001",
  "recipientName": "Rajesh (Maintenance)",
  "messageTemplate": "maintenance_daily_reminder",
  "templateVars": { "1": "CNC Bay 3", "2": "{{date}}" },
  "retryPolicy": { "maxRetries": 3, "backoffSeconds": 300 },
  "escalationConfig": {
    "enabled": true,
    "ifNoReplyWithin": 7200,
    "escalateTo": "+919876500002",
    "escalationMessage": "No response from Rajesh on CNC Bay 3 maintenance."
  }
}
```

**Response `201`:** Returns the created schedule with computed `nextRunAt`.

### `PATCH /api/schedules/:id/pause`

Transition schedule FSM to PAUSED state.

**Response `200`:**
```json
{ "id": "770e8400-...", "status": "paused" }
```

### `PATCH /api/schedules/:id/resume`

Transition schedule FSM to ENABLED state.

**Response `200`:**
```json
{ "id": "770e8400-...", "status": "enabled", "nextRunAt": "2026-11-06T08:00:00.000Z" }
```

### `DELETE /api/schedules/:id`

Transition schedule FSM to DELETED (terminal state). Removes the Bull job.

**Response `204`:** No content.

---

## Analytics

### `GET /api/analytics/dashboard`

Real-time dashboard metrics.

**Response `200`:**
```json
{
  "today": {
    "messagesInbound": 47,
    "messagesOutbound": 31,
    "messagesScheduled": 12,
    "escalationsActive": 2,
    "avgResponseTime": "1.3 hours"
  },
  "schedules": {
    "total": 23,
    "enabled": 20,
    "paused": 2,
    "error": 1
  },
  "agents": {
    "total": 8,
    "active": 7
  }
}
```

### `GET /api/analytics/digest/:period`

Get or generate an executive digest for a period.

**Path Parameters:**

| Param | Values |
|:------|:-------|
| `period` | `daily`, `weekly`, `monthly` |

**Response `200`:**
```json
{
  "period": "daily",
  "date": "2026-11-05",
  "digest": "## Daily Operations Summary — Nov 5, 2026\n\n### Maintenance\n- CNC Bay 3: Bearing replacement completed (Rajesh)\n...",
  "metrics": {
    "tasksCompleted": 18,
    "tasksPending": 4,
    "escalations": 2
  },
  "generatedAt": "2026-11-05T18:00:00.000Z"
}
```

---

## WebSocket Events

Connect to `ws://localhost:3000` with Socket.IO client.

### Server → Client

| Event | Payload | Trigger |
|:------|:--------|:--------|
| `sync_event` | `{ type, contact, source, payload, priority }` | CESSP sync event |
| `new_message` | `{ message, conversation }` | Inbound/outbound message for agent |
| `escalation` | `{ scheduleId, reason, escalatedTo }` | Scheduler escalation triggered |
| `schedule_update` | `{ scheduleId, status, lastRun }` | Schedule state transition |

### Client → Server

| Event | Payload | Description |
|:------|:--------|:------------|
| `authenticate` | `{ token }` | Authenticate WebSocket with JWT |
| `mark_read` | `{ conversationId }` | Mark conversation as read |
