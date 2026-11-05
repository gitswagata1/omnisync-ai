import { Router } from 'express';

export const agentsRouter = Router();

// GET /api/agents — List agents
agentsRouter.get('/', async (_req, res) => {
  // TODO: Return agents with role tags
  res.status(501).json({ error: 'Not implemented' });
});

// POST /api/agents — Register new agent
agentsRouter.post('/', async (_req, res) => {
  // TODO: Create agent with HMAC-SHA256 auth_hash, assign permissions
  res.status(501).json({ error: 'Not implemented' });
});
