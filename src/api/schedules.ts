import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { addScheduleJob, removeScheduleJob } from '../services/scheduler-engine.js';
import {
  SchedulerState,
  SchedulerEvent,
  transition,
  InvalidTransitionError,
} from '../services/scheduler-fsm.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

export const schedulesRouter = Router();

const createScheduleSchema = z.object({
  name: z.string().min(1).max(255),
  scheduleType: z.string().optional(),
  cronExpression: z.string().min(9),
  recipientPhone: z.string().min(10),
  recipientName: z.string().optional(),
  messageTemplate: z.string().optional(),
  templateVars: z.record(z.string()).optional(),
  expectedCriteria: z.string().optional(),
  retryPolicy: z
    .object({
      maxRetries: z.number().int().min(0).max(10),
      backoffSeconds: z.number().int().min(60),
    })
    .optional(),
  escalationConfig: z
    .object({
      enabled: z.boolean(),
      escalateTo: z.string().optional(),
      escalationTemplate: z.string().optional(),
      ifNoReplyWithin: z.number().int().optional(),
    })
    .optional(),
});

schedulesRouter.get(
  '/',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const agent = req.agent!;
      const statusFilter = req.query.status as string | undefined;

      const where: Record<string, unknown> = {};
      if (statusFilter) {
        where.status = statusFilter;
      }

      if (!(agent.permissions as string[]).includes('view_all')) {
        where.OR = [
          { agentId: agent.id },
          { createdBy: agent.id },
        ];
      }

      const schedules = await prisma.schedule.findMany({
        where,
        include: {
          agent: { select: { id: true, userName: true, roleTag: true } },
          _count: { select: { logs: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ schedules });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch schedules' });
    }
  }
);

schedulesRouter.post(
  '/',
  authMiddleware,
  validate(createScheduleSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const agent = req.agent!;

      const schedule = await prisma.schedule.create({
        data: {
          name: req.body.name,
          scheduleType: req.body.scheduleType,
          cronExpression: req.body.cronExpression,
          recipientPhone: req.body.recipientPhone,
          recipientName: req.body.recipientName,
          messageTemplate: req.body.messageTemplate,
          templateVars: req.body.templateVars ?? {},
          expectedCriteria: req.body.expectedCriteria,
          retryPolicy: req.body.retryPolicy ?? {
            maxRetries: 3,
            backoffSeconds: 300,
          },
          escalationConfig: req.body.escalationConfig,
          agentId: agent.id,
          createdBy: agent.id,
          status: SchedulerState.ENABLED.toLowerCase(),
        },
      });

      await addScheduleJob(schedule.id, schedule.cronExpression);

      await prisma.auditLog.create({
        data: {
          actorAgentId: agent.id,
          action: 'schedule_created',
          targetType: 'schedule',
          targetId: schedule.id,
          metadata: { name: schedule.name, cron: schedule.cronExpression },
        },
      });

      res.status(201).json({ schedule });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create schedule' });
    }
  }
);

schedulesRouter.patch(
  '/:id/pause',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const schedule = await prisma.schedule.findUnique({
        where: { id: req.params.id },
      });

      if (!schedule) {
        res.status(404).json({ error: 'Schedule not found' });
        return;
      }

      const currentState = schedule.status.toUpperCase() as SchedulerState;
      let pausedState: SchedulerState;
      try {
        pausedState = transition(currentState, SchedulerEvent.MANUAL_PAUSE);
      } catch (err) {
        if (err instanceof InvalidTransitionError) {
          res.status(400).json({ error: `Cannot pause from ${schedule.status} state` });
          return;
        }
        throw err;
      }

      await removeScheduleJob(schedule.id);
      await prisma.schedule.update({
        where: { id: schedule.id },
        data: { status: pausedState.toLowerCase() },
      });

      await prisma.auditLog.create({
        data: {
          actorAgentId: req.agent!.id,
          action: 'schedule_paused',
          targetType: 'schedule',
          targetId: schedule.id,
        },
      });

      res.json({ status: 'paused' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to pause schedule' });
    }
  }
);

schedulesRouter.patch(
  '/:id/resume',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const schedule = await prisma.schedule.findUnique({
        where: { id: req.params.id },
      });

      if (!schedule) {
        res.status(404).json({ error: 'Schedule not found' });
        return;
      }

      if (!['paused', 'error'].includes(schedule.status)) {
        res.status(400).json({ error: `Cannot resume from ${schedule.status} state` });
        return;
      }

      await prisma.schedule.update({
        where: { id: schedule.id },
        data: { status: 'enabled', errorCount: 0 },
      });

      await addScheduleJob(schedule.id, schedule.cronExpression);

      await prisma.auditLog.create({
        data: {
          actorAgentId: req.agent!.id,
          action: 'schedule_resumed',
          targetType: 'schedule',
          targetId: schedule.id,
        },
      });

      res.json({ status: 'enabled' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to resume schedule' });
    }
  }
);

schedulesRouter.delete(
  '/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const schedule = await prisma.schedule.findUnique({
        where: { id: req.params.id },
      });

      if (!schedule) {
        res.status(404).json({ error: 'Schedule not found' });
        return;
      }

      await removeScheduleJob(schedule.id);
      await prisma.schedule.update({
        where: { id: schedule.id },
        data: { status: 'deleted' },
      });

      await prisma.auditLog.create({
        data: {
          actorAgentId: req.agent!.id,
          action: 'schedule_deleted',
          targetType: 'schedule',
          targetId: schedule.id,
        },
      });

      res.json({ status: 'deleted' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete schedule' });
    }
  }
);

schedulesRouter.get(
  '/:id/logs',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const logs = await prisma.scheduleLog.findMany({
        where: { scheduleId: req.params.id },
        orderBy: { executedAt: 'desc' },
        take: 50,
      });

      res.json({ logs });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch logs' });
    }
  }
);
