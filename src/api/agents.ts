import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { generateAuthHash, buildRoleTag } from '../services/agent-identity.js';
import { generateToken } from '../middleware/auth.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

export const agentsRouter = Router();

const createAgentSchema = z.object({
  company: z.string().default('Micro Turner'),
  userName: z.string().min(1).max(100),
  role: z.string().min(1).max(100),
  department: z.string().min(1).max(100),
  personalPhone: z.string().optional(),
  permissions: z.array(z.string()).default([]),
});

const loginSchema = z.object({
  agentId: z.string().uuid(),
});

agentsRouter.get(
  '/',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const agent = req.agent!;
      const where: Record<string, unknown> = { status: 'active' };

      if (!(agent.permissions).includes('view_all')) {
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

agentsRouter.post(
  '/',
  validate(createAgentSchema),
  async (req: Request, res: Response) => {
    try {
      const { company, userName, role, department, personalPhone, permissions } =
        req.body;

      const existing = await prisma.agent.findFirst({
        where: { userName, company, department },
      });
      if (existing) {
        res.status(409).json({ error: 'Agent already exists with this name in department' });
        return;
      }

      const tempId = crypto.randomUUID();
      const authHash = generateAuthHash(tempId, role, department);
      const roleTag = buildRoleTag(company, userName, department);

      const agent = await prisma.agent.create({
        data: {
          id: tempId,
          company,
          userName,
          role,
          department,
          personalPhone,
          roleTag,
          permissions,
          authHash,
        },
      });

      const token = generateToken(agent.id);

      await prisma.auditLog.create({
        data: {
          actorAgentId: agent.id,
          action: 'agent_created',
          targetType: 'agent',
          targetId: agent.id,
          metadata: { userName, role, department },
        },
      });

      res.status(201).json({
        agent: {
          id: agent.id,
          company: agent.company,
          userName: agent.userName,
          role: agent.role,
          department: agent.department,
          roleTag: agent.roleTag,
        },
        token,
      });
    } catch {
      res.status(500).json({ error: 'Failed to create agent' });
    }
  }
);

agentsRouter.post(
  '/login',
  validate(loginSchema),
  async (req: Request, res: Response) => {
    try {
      const agent = await prisma.agent.findUnique({
        where: { id: req.body.agentId },
      });

      if (!agent || agent.status !== 'active') {
        res.status(401).json({ error: 'Agent not found or inactive' });
        return;
      }

      const token = generateToken(agent.id);

      res.json({
        agent: {
          id: agent.id,
          company: agent.company,
          userName: agent.userName,
          role: agent.role,
          department: agent.department,
          roleTag: agent.roleTag,
        },
        token,
      });
    } catch {
      res.status(500).json({ error: 'Login failed' });
    }
  }
);
