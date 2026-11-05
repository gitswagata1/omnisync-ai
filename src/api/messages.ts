import { Router } from 'express';

export const messagesRouter = Router();

// POST /api/messages/send — Send outbound message via agent
messagesRouter.post('/send', async (_req, res) => {
  // TODO: Implement outbound message multiplexer
  // 1. Verify agent auth_hash
  // 2. Check send_permission(agent, contact)
  // 3. Collision detection (check recent outbound to same contact)
  // 4. Dispatch via WhatsApp Cloud API with role tag
  // 5. Broadcast to peer agents in V(contact)
  // 6. Log in audit trail
  res.status(501).json({ error: 'Not implemented' });
});

// GET /api/messages/:conversationId — Get conversation thread
messagesRouter.get('/:conversationId', async (_req, res) => {
  // TODO: Fetch messages for conversation with RBAC check
  res.status(501).json({ error: 'Not implemented' });
});
