import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { hashPassword, verifyPassword, MIN_PASSWORD_LENGTH } from '../lib/password.js';
import { clearSessionCookie, setSessionCookie } from '../lib/session.js';
import { generateAuthHash, buildRoleTag } from '../services/agent-identity.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

export const agentsRouter = Router();

const ADMIN_PERMISSION = 'view_all';

const passwordSchema = z.string().min(MIN_PASSWORD_LENGTH).max(256);

const createAgentSchema = z.object({
  company: z.string().default('Micro Turner'),
  userName: z.string().min(1).max(100),
  role: z.string().min(1).max(100),
  department: z.string().min(1).max(100),
  personalPhone: z.string().optional(),
  email: z.string().trim().toLowerCase().email().max(255),
  password: passwordSchema,
  permissions: z.array(z.string()).default([]),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(1).max(256),
});

// Limits password guessing per client. Successful logins do not count.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again later.' },
});

function publicAgent(agent: {
  id: string;
  company: string;
  userName: string;
  role: string;
  department: string;
  roleTag: string;
  email?: string | null;
  permissions?: unknown;
}) {
  return {
    id: agent.id,
    company: agent.company,
    userName: agent.userName,
    role: agent.role,
    department: agent.department,
    roleTag: agent.roleTag,
    email: agent.email ?? null,
    permissions: agent.permissions ?? [],
  };
}

agentsRouter.get(
  '/',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const agent = req.agent!;
      const where: Record<string, unknown> = { status: 'active' };

      if (!agent.permissions.includes(ADMIN_PERMISSION)) {
        where.department = agent.department;
      }

      const agents = await prisma.agent.findMany({
        where,
        select: {
          id: true,
          company: true,
          userName: true,
          role: true,
          department: true,
          roleTag: true,
          permissions: true,
          status: true,
          createdAt: true,
        },
        orderBy: { userName: 'asc' },
      });

      res.json({ agents });
    } catch {
      res.status(500).json({ error: 'Failed to fetch agents' });
    }
  }
);

/** Creates an agent. Only an agent with the admin permission may do this. */
agentsRouter.post(
  '/',
  authMiddleware,
  validate(createAgentSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.agent!.permissions.includes(ADMIN_PERMISSION)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    try {
      const { company, userName, role, department, personalPhone, email, password, permissions } =
        req.body as z.infer<typeof createAgentSchema>;

      const existing = await prisma.agent.findFirst({
        where: { userName, company, department },
      });
      if (existing) {
        res.status(409).json({ error: 'Agent already exists with this name in department' });
        return;
      }

      const id = crypto.randomUUID();
      const agent = await prisma.agent.create({
        data: {
          id,
          company,
          userName,
          role,
          department,
          personalPhone,
          email,
          passwordHash: await hashPassword(password),
          roleTag: buildRoleTag(company, userName, department),
          permissions,
          authHash: generateAuthHash(id, role, department),
        },
      });

      await prisma.auditLog.create({
        data: {
          actorAgentId: req.agent!.id,
          action: 'agent_created',
          targetType: 'agent',
          targetId: agent.id,
          metadata: { userName, role, department },
        },
      });

      res.status(201).json({ agent: publicAgent(agent) });
    } catch (err) {
      if (typeof err === 'object' && err !== null && 'code' in err && err.code === 'P2002') {
        res.status(409).json({ error: 'An agent with this email already exists' });
        return;
      }
      res.status(500).json({ error: 'Failed to create agent' });
    }
  }
);

agentsRouter.post(
  '/login',
  loginLimiter,
  validate(loginSchema),
  async (req: Request, res: Response) => {
    const { email, password } = req.body as z.infer<typeof loginSchema>;

    try {
      const agent = await prisma.agent.findUnique({ where: { email } });
      const passwordOk = await verifyPassword(password, agent?.passwordHash ?? null);

      if (!agent || !passwordOk || agent.status !== 'active') {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      setSessionCookie(res, agent.id);
      res.json({ agent: publicAgent(agent) });
    } catch {
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

agentsRouter.post('/logout', (_req: Request, res: Response) => {
  clearSessionCookie(res);
  res.status(204).end();
});

agentsRouter.get(
  '/me',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    const agent = await prisma.agent.findUnique({ where: { id: req.agent!.id } });
    if (!agent) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    res.json({ agent: publicAgent(agent) });
  }
);
