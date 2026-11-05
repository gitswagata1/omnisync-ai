import { Router, Response } from 'express';
import { routeParam } from '../utils/params.js';
import { prisma } from '../lib/prisma.js';
import { generateDigest } from '../services/llm-evaluator.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

export const analyticsRouter = Router();

analyticsRouter.get(
  '/dashboard',
  authMiddleware,
  async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [
        messagesToday,
        activeSchedules,
        pendingEscalations,
        scheduleLogs,
        totalContacts,
        totalAgents,
      ] = await Promise.all([
        prisma.message.groupBy({
          by: ['direction'],
          where: { createdAt: { gte: todayStart } },
          _count: true,
        }),
        prisma.schedule.groupBy({
          by: ['status'],
          _count: true,
        }),
        prisma.escalation.count({
          where: { resolvedAt: null },
        }),
        prisma.scheduleLog.findMany({
          where: { executedAt: { gte: todayStart } },
          select: { status: true, executedAt: true, responseAt: true },
        }),
        prisma.contact.count(),
        prisma.agent.count({ where: { status: 'active' } }),
      ]);

      const messageStats = {
        inbound: messagesToday.find((m) => m.direction === 'inbound')?._count ?? 0,
        outbound: messagesToday.find((m) => m.direction === 'outbound')?._count ?? 0,
      };

      const scheduleStats: Record<string, number> = {};
      for (const s of activeSchedules) {
        scheduleStats[s.status] = s._count;
      }

      const responseTimesMs = scheduleLogs
        .filter((l) => l.responseAt)
        .map((l) => l.responseAt!.getTime() - l.executedAt.getTime());

      const avgResponseTimeMs =
        responseTimesMs.length > 0
          ? responseTimesMs.reduce((a, b) => a + b, 0) / responseTimesMs.length
          : null;

      res.json({
        timestamp: new Date().toISOString(),
        messages: {
          ...messageStats,
          total: messageStats.inbound + messageStats.outbound,
        },
        schedules: scheduleStats,
        escalations: {
          pending: pendingEscalations,
        },
        performance: {
          scheduledExecutionsToday: scheduleLogs.length,
          successfulToday: scheduleLogs.filter((l) => l.status === 'success').length,
          avgResponseTimeMinutes: avgResponseTimeMs
            ? Math.round(avgResponseTimeMs / 60000)
            : null,
        },
        totals: {
          contacts: totalContacts,
          activeAgents: totalAgents,
        },
      });
    } catch {
      res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
    }
  }
);

analyticsRouter.get(
  '/digest/:period',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const period = routeParam(req.params.period);
      const now = new Date();
      let start: Date;

      switch (period) {
        case 'daily': {
          start = new Date(now);
          start.setHours(0, 0, 0, 0);
          break;
        }
        case 'weekly': {
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        }
        case 'monthly': {
          start = new Date(now);
          start.setMonth(start.getMonth() - 1);
          break;
        }
        default:
          res.status(400).json({ error: 'Invalid period. Use: daily, weekly, monthly' });
          return;
      }

      const digest = await generateDigest(
        { start, end: now },
        `${period} operations report`
      );

      res.json({
        period,
        start: start.toISOString(),
        end: now.toISOString(),
        digest,
      });
    } catch {
      res.status(500).json({ error: 'Failed to generate digest' });
    }
  }
);

analyticsRouter.get(
  '/audit',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const agent = req.agent!;
      if (!(agent.permissions).includes('view_all')) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.auditLog.count(),
      ]);

      res.json({
        logs,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch {
      res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  }
);
