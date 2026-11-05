import { Router, Response } from 'express';
import { routeParam } from '../utils/params.js';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { multiplexOutbound } from '../services/message-router.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

export const messagesRouter = Router();

const sendMessageSchema = z.object({
  contactPhone: z.string().min(10),
  body: z.string().min(1).max(4096),
});

messagesRouter.post(
  '/send',
  authMiddleware,
  validate(sendMessageSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { contactPhone, body } = req.body;

      const result = await multiplexOutbound(
        req.agent!.id,
        contactPhone,
        body
      );

      res.status(201).json({
        messageId: result.messageId,
        waMessageId: result.waMessageId,
        collision: result.collision,
        collisionWarning: result.collision
          ? 'Another agent recently contacted this recipient. Check the conversation thread.'
          : undefined,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Send failed';
      const status = message.includes('permission') ? 403 : 500;
      res.status(status).json({ error: message });
    }
  }
);

messagesRouter.get(
  '/:conversationId',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: routeParam(req.params.conversationId) },
        include: { contact: true },
      });

      if (!conversation) {
        res.status(404).json({ error: 'Conversation not found' });
        return;
      }

      const agent = req.agent!;
      const hasAccess =
        (agent.permissions).includes('view_all') ||
        conversation.contact.departments.includes(agent.department);

      if (!hasAccess) {
        res.status(403).json({ error: 'No access to this conversation' });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const skip = (page - 1) * limit;

      const [messages, total] = await Promise.all([
        prisma.message.findMany({
          where: { conversationId: conversation.id },
          include: { senderAgent: { select: { id: true, userName: true, roleTag: true } } },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.message.count({
          where: { conversationId: conversation.id },
        }),
      ]);

      res.json({
        conversation: {
          id: conversation.id,
          contact: conversation.contact,
          status: conversation.status,
          messageCount: conversation.messageCount,
        },
        messages,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch {
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  }
);
