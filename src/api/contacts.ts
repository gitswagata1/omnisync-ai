import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

export const contactsRouter = Router();

const createContactSchema = z.object({
  phone: z.string().min(10),
  name: z.string().optional(),
  organization: z.string().optional(),
  contactType: z.enum(['client', 'vendor', 'internal']).optional(),
  departments: z.array(z.string()).min(1),
  assignedAgentIds: z.array(z.string().uuid()).optional(),
});

contactsRouter.get(
  '/',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const agent = req.agent!;

      const contacts = await prisma.contact.findMany({
        where:
          (agent.permissions as string[]).includes('view_all')
            ? {}
            : { departments: { has: agent.department } },
        include: {
          _count: { select: { conversations: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ contacts });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch contacts' });
    }
  }
);

contactsRouter.post(
  '/',
  authMiddleware,
  validate(createContactSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const existing = await prisma.contact.findUnique({
        where: { phone: req.body.phone },
      });

      if (existing) {
        res.status(409).json({ error: 'Contact with this phone already exists' });
        return;
      }

      const contact = await prisma.contact.create({
        data: {
          phone: req.body.phone,
          name: req.body.name,
          organization: req.body.organization,
          contactType: req.body.contactType,
          departments: req.body.departments,
          assignedAgentIds: req.body.assignedAgentIds ?? [],
          contextCard: {
            unifiedTimeline: [],
            activeCommitments: [],
            conflictFlags: [],
            contextSummary: '',
          },
        },
      });

      await prisma.auditLog.create({
        data: {
          actorAgentId: req.agent!.id,
          action: 'contact_created',
          targetType: 'contact',
          targetId: contact.id,
          metadata: {
            phone: contact.phone,
            name: contact.name,
            departments: contact.departments,
          },
        },
      });

      res.status(201).json({ contact });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create contact' });
    }
  }
);

contactsRouter.get(
  '/:id/context',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const agent = req.agent!;

      const contact = await prisma.contact.findUnique({
        where: { id: req.params.id },
      });

      if (!contact) {
        res.status(404).json({ error: 'Contact not found' });
        return;
      }

      const hasAccess =
        (agent.permissions as string[]).includes('view_all') ||
        contact.departments.includes(agent.department);

      if (!hasAccess) {
        res.status(403).json({ error: 'No access to this contact' });
        return;
      }

      const conversations = await prisma.conversation.findMany({
        where: { contactId: contact.id },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: {
              senderAgent: {
                select: { id: true, userName: true, roleTag: true },
              },
            },
          },
        },
        orderBy: { lastMessageAt: 'desc' },
      });

      const escalations = await prisma.escalation.findMany({
        where: {
          sourceId: {
            in: (
              await prisma.schedule.findMany({
                where: { recipientPhone: contact.phone },
                select: { id: true },
              })
            ).map((s) => s.id),
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      res.json({
        contact,
        contextVector: {
          contactId: contact.id,
          organization: contact.organization,
          departmentBindings: contact.departments,
          contextCard: contact.contextCard,
          conversations: conversations.map((c) => ({
            id: c.id,
            department: c.department,
            status: c.status,
            messageCount: c.messages.length,
            recentMessages: c.messages,
          })),
          recentEscalations: escalations,
        },
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch context' });
    }
  }
);

contactsRouter.patch(
  '/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const contact = await prisma.contact.findUnique({
        where: { id: req.params.id },
      });

      if (!contact) {
        res.status(404).json({ error: 'Contact not found' });
        return;
      }

      const updated = await prisma.contact.update({
        where: { id: req.params.id },
        data: {
          name: req.body.name ?? contact.name,
          organization: req.body.organization ?? contact.organization,
          contactType: req.body.contactType ?? contact.contactType,
          departments: req.body.departments ?? contact.departments,
          assignedAgentIds: req.body.assignedAgentIds ?? contact.assignedAgentIds,
        },
      });

      res.json({ contact: updated });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update contact' });
    }
  }
);
