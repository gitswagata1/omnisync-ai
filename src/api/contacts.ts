import { Router } from 'express';

export const contactsRouter = Router();

// GET /api/contacts — List contacts with department bindings
contactsRouter.get('/', async (_req, res) => {
  // TODO: Return contacts with CCV summaries, filtered by agent's department
  res.status(501).json({ error: 'Not implemented' });
});

// POST /api/contacts — Create contact with department bindings
contactsRouter.post('/', async (_req, res) => {
  // TODO: Create contact, set department bindings, initialize CCV
  res.status(501).json({ error: 'Not implemented' });
});

// GET /api/contacts/:id/context — Get full Contact Context Vector
contactsRouter.get('/:id/context', async (_req, res) => {
  // TODO: Return full CCV with unified timeline and active commitments
  res.status(501).json({ error: 'Not implemented' });
});
