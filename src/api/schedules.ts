import { Router } from 'express';

export const schedulesRouter = Router();

// GET /api/schedules — List all schedules
schedulesRouter.get('/', async (_req, res) => {
  // TODO: Return schedules with RBAC filtering
  res.status(501).json({ error: 'Not implemented' });
});

// POST /api/schedules — Create new schedule
schedulesRouter.post('/', async (_req, res) => {
  // TODO: Validate cron expression, create Bull repeatable job, persist to DB
  res.status(501).json({ error: 'Not implemented' });
});

// PATCH /api/schedules/:id/pause — Pause schedule
schedulesRouter.patch('/:id/pause', async (_req, res) => {
  // TODO: Transition state machine to PAUSED
  res.status(501).json({ error: 'Not implemented' });
});

// PATCH /api/schedules/:id/resume — Resume schedule
schedulesRouter.patch('/:id/resume', async (_req, res) => {
  // TODO: Transition state machine to ENABLED
  res.status(501).json({ error: 'Not implemented' });
});

// DELETE /api/schedules/:id — Delete schedule
schedulesRouter.delete('/:id', async (_req, res) => {
  // TODO: Transition state machine to DELETED, remove Bull job
  res.status(501).json({ error: 'Not implemented' });
});
