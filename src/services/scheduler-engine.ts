import Queue from 'bull';
import cron from 'node-cron';
import { prisma } from '../lib/prisma.js';
import { sendTemplateMessage, sendTextMessage } from '../lib/whatsapp.js';
import { evaluateResponse, generateDigest } from './llm-evaluator.js';
import { triggerEscalation } from './escalation.js';
import {
  SchedulerState,
  SchedulerEvent,
  transition,
  InvalidTransitionError,
  retryBackoff,
} from './scheduler-fsm.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import type { Server as SocketServer } from 'socket.io';

function stateToDb(state: SchedulerState): string {
  return state.toLowerCase();
}

function dbToState(status: string): SchedulerState {
  return status.toUpperCase() as SchedulerState;
}

interface ScheduleJobData {
  scheduleId: string;
}

interface ResponseJobData {
  scheduleLogId: string;
  scheduleId: string;
}

let scheduleQueue: Queue.Queue<ScheduleJobData>;
let responseTimeoutQueue: Queue.Queue<ResponseJobData>;
let io: SocketServer;

export function initSchedulerEngine(socketIo: SocketServer): void {
  io = socketIo;
  logger.info('Initializing scheduler engine');

  scheduleQueue = new Queue<ScheduleJobData>('schedule-dispatch', config.redis.url);
  responseTimeoutQueue = new Queue<ResponseJobData>('response-timeout', config.redis.url);

  scheduleQueue.process(processScheduleJob);
  responseTimeoutQueue.process(processResponseTimeout);

  scheduleQueue.on('failed', (job, err) => {
    logger.error(`Schedule job ${job.id} failed: ${err.message}`);
  });

  loadSchedules();
  initDigestCrons();

  logger.info('Scheduler engine initialized');
}

async function loadSchedules(): Promise<void> {
  const schedules = await prisma.schedule.findMany({
    where: { status: stateToDb(SchedulerState.ENABLED) },
  });

  for (const schedule of schedules) {
    await addScheduleJob(schedule.id, schedule.cronExpression);
  }

  logger.info(`Loaded ${schedules.length} active schedules`);
}

export async function addScheduleJob(
  scheduleId: string,
  cronExpression: string
): Promise<void> {
  await scheduleQueue.add(
    { scheduleId },
    {
      repeat: { cron: cronExpression },
      jobId: `schedule:${scheduleId}`,
      removeOnComplete: 100,
      removeOnFail: 50,
    }
  );
}

export async function removeScheduleJob(scheduleId: string): Promise<void> {
  const jobs = await scheduleQueue.getRepeatableJobs();
  for (const job of jobs) {
    if (job.id === `schedule:${scheduleId}`) {
      await scheduleQueue.removeRepeatableByKey(job.key);
    }
  }
}

async function processScheduleJob(
  job: Queue.Job<ScheduleJobData>
): Promise<void> {
  const { scheduleId } = job.data;

  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
  });

  if (!schedule || schedule.status !== stateToDb(SchedulerState.ENABLED)) {
    logger.info(`Schedule ${scheduleId} no longer active, skipping`);
    return;
  }

  logger.info(`Executing schedule: ${schedule.name} (${scheduleId})`);

  const currentState = dbToState(schedule.status);
  const runningState = transition(currentState, SchedulerEvent.CRON_FIRE);

  await prisma.schedule.update({
    where: { id: scheduleId },
    data: { status: stateToDb(runningState), lastRunAt: new Date() },
  });

  let waMessageId: string | undefined;
  let logStatus = 'success';
  let errorMessage: string | undefined;

  try {
    if (schedule.messageTemplate) {
      const vars = schedule.templateVars as Record<string, string>;
      const components = Object.keys(vars).length > 0
        ? [
            {
              type: 'body' as const,
              parameters: Object.values(vars).map((v) => ({
                type: 'text' as const,
                text: v.replace('{{date}}', new Date().toLocaleDateString()),
              })),
            },
          ]
        : [];

      waMessageId = await sendTemplateMessage(
        schedule.recipientPhone,
        schedule.messageTemplate,
        'en',
        components
      );
    } else {
      const vars = schedule.templateVars as Record<string, string>;
      const body = vars.body ?? `Reminder: ${schedule.name}`;
      waMessageId = await sendTextMessage(schedule.recipientPhone, body);
    }
  } catch (err) {
    logStatus = 'failed';
    errorMessage = err instanceof Error ? err.message : String(err);
    logger.error(`Schedule dispatch failed: ${errorMessage}`);
  }

  const scheduleLog = await prisma.scheduleLog.create({
    data: {
      scheduleId,
      status: logStatus,
      waMessageId,
      errorMessage,
    },
  });

  if (logStatus === 'success') {
    const waitingState = transition(runningState, SchedulerEvent.MSG_SENT);
    await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        status: stateToDb(waitingState),
        runCount: { increment: 1 },
      },
    });

    const timeoutSeconds =
      (schedule.escalationConfig as Record<string, unknown>)?.ifNoReplyWithin ??
      config.scheduler.defaultTimeoutSeconds;

    await responseTimeoutQueue.add(
      { scheduleLogId: scheduleLog.id, scheduleId },
      {
        delay: (timeoutSeconds as number) * 1000,
        jobId: `timeout:${scheduleLog.id}`,
        removeOnComplete: true,
      }
    );

    io.emit('schedule_executed', {
      scheduleId,
      scheduleName: schedule.name,
      status: 'success',
      timestamp: new Date().toISOString(),
    });
  } else {
    const failedState = transition(runningState, SchedulerEvent.MSG_FAILED);
    const retryPolicy = schedule.retryPolicy as {
      maxRetries: number;
      backoffSeconds: number;
    };

    if (schedule.errorCount + 1 < retryPolicy.maxRetries) {
      const retryState = transition(failedState, SchedulerEvent.RETRY_AVAILABLE);
      await prisma.schedule.update({
        where: { id: scheduleId },
        data: {
          status: stateToDb(retryState),
          errorCount: { increment: 1 },
        },
      });

      const backoff = retryBackoff(schedule.errorCount, retryPolicy.backoffSeconds);
      logger.info(
        `Retrying schedule ${scheduleId} in ${backoff}s (attempt ${schedule.errorCount + 1}/${retryPolicy.maxRetries})`
      );
    } else {
      const errorState = transition(failedState, SchedulerEvent.RETRY_EXHAUST);
      await prisma.schedule.update({
        where: { id: scheduleId },
        data: { status: stateToDb(errorState), errorCount: { increment: 1 } },
      });
      await removeScheduleJob(scheduleId);
      logger.error(
        `Schedule ${scheduleId} exhausted retries, moved to ${errorState}`
      );

      io.emit('schedule_error', {
        scheduleId,
        scheduleName: schedule.name,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
    }
  }
}

async function processResponseTimeout(
  job: Queue.Job<ResponseJobData>
): Promise<void> {
  const { scheduleLogId, scheduleId } = job.data;

  const scheduleLog = await prisma.scheduleLog.findUnique({
    where: { id: scheduleLogId },
  });

  if (!scheduleLog) return;

  if (scheduleLog.responseReceived) {
    logger.info(
      `Response already received for log ${scheduleLogId}, skipping timeout`
    );
    return;
  }

  logger.warn(`Response timeout for schedule ${scheduleId}`);

  const schedule = await prisma.schedule.findUnique({ where: { id: scheduleId } });
  if (schedule) {
    try {
      const escalatedState = transition(
        dbToState(schedule.status),
        SchedulerEvent.TIMEOUT
      );
      await prisma.schedule.update({
        where: { id: scheduleId },
        data: { status: stateToDb(escalatedState) },
      });
    } catch (err) {
      if (!(err instanceof InvalidTransitionError)) throw err;
      logger.warn(`FSM: cannot timeout from state ${schedule.status}`);
    }
  }

  await triggerEscalation(scheduleId, 'No response received within timeout period');
}

export async function handleScheduleResponse(
  senderPhone: string,
  responseBody: string
): Promise<boolean> {
  const recentLog = await prisma.scheduleLog.findFirst({
    where: {
      schedule: { recipientPhone: senderPhone },
      status: 'success',
      responseReceived: false,
      executedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    include: { schedule: true },
    orderBy: { executedAt: 'desc' },
  });

  if (!recentLog) return false;

  logger.info(
    `Evaluating response to schedule ${recentLog.scheduleId} from ${senderPhone}`
  );

  const schedule = recentLog.schedule;
  const vars = schedule.templateVars as Record<string, string>;
  const originalMessage = vars.body ?? schedule.name;

  const evaluation = await evaluateResponse(
    originalMessage,
    responseBody,
    schedule.scheduleType ?? 'general',
    schedule.expectedCriteria ?? 'Complete and relevant response to the scheduled message'
  );

  await prisma.scheduleLog.update({
    where: { id: recentLog.id },
    data: {
      responseReceived: true,
      responseAt: new Date(),
      llmEvaluation: evaluation as unknown as Record<string, unknown>,
    },
  });

  const currentState = dbToState(schedule.status);

  switch (evaluation.decision) {
    case 'ACCEPT': {
      const successState = transition(currentState, SchedulerEvent.LLM_ACCEPT);
      logger.info(`Response ACCEPTED for schedule ${schedule.id} -> ${successState}`);
      await prisma.schedule.update({
        where: { id: schedule.id },
        data: { status: stateToDb(successState) },
      });

      io.emit('schedule_response', {
        scheduleId: schedule.id,
        scheduleName: schedule.name,
        decision: 'ACCEPT',
        timestamp: new Date().toISOString(),
      });
      break;
    }

    case 'CLARIFY': {
      const clarifyState = transition(currentState, SchedulerEvent.LLM_CLARIFY);
      logger.info(`Response needs CLARIFICATION for schedule ${schedule.id} -> ${clarifyState}`);
      if (evaluation.followUp) {
        await sendTextMessage(senderPhone, evaluation.followUp);
      }
      break;
    }

    case 'REJECT': {
      const rejectState = transition(currentState, SchedulerEvent.LLM_REJECT);
      logger.warn(`Response REJECTED for schedule ${schedule.id} -> ${rejectState}`);
      if (evaluation.followUp) {
        await sendTextMessage(senderPhone, evaluation.followUp);
      }
      await prisma.schedule.update({
        where: { id: schedule.id },
        data: { status: stateToDb(rejectState) },
      });
      await triggerEscalation(schedule.id, 'Response did not meet compliance requirements');
      break;
    }
  }

  return true;
}

function initDigestCrons(): void {
  // Daily EOD digest at 6:00 PM Mon-Sat
  cron.schedule('0 18 * * 1-6', async () => {
    logger.info('Generating daily EOD digest');
    try {
      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);

      const digest = await generateDigest(
        { start: startOfDay, end: now },
        'VP Operations — Daily EOD'
      );

      const vpAgents = await prisma.agent.findMany({
        where: {
          permissions: { path: '$', array_contains: 'view_all' },
          status: 'active',
        },
      });

      for (const vp of vpAgents) {
        if (vp.personalPhone) {
          await sendTextMessage(vp.personalPhone, digest);
        }
      }

      io.emit('digest_generated', {
        type: 'daily',
        timestamp: now.toISOString(),
      });
    } catch (err) {
      logger.error(`Daily digest generation failed: ${err}`);
    }
  });

  // Weekly wrap-up Monday 9 AM
  cron.schedule('0 9 * * 1', async () => {
    logger.info('Generating weekly wrap-up');
    try {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const digest = await generateDigest(
        { start: weekAgo, end: now },
        'VP Operations — Weekly Summary'
      );

      const vpAgents = await prisma.agent.findMany({
        where: {
          permissions: { path: '$', array_contains: 'view_all' },
          status: 'active',
        },
      });

      for (const vp of vpAgents) {
        if (vp.personalPhone) {
          await sendTextMessage(vp.personalPhone, digest);
        }
      }
    } catch (err) {
      logger.error(`Weekly digest generation failed: ${err}`);
    }
  });

  // Monthly report 1st of each month at 9 AM
  cron.schedule('0 9 1 * *', async () => {
    logger.info('Generating monthly report');
    try {
      const now = new Date();
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      const digest = await generateDigest(
        { start: monthAgo, end: now },
        'MD / VP — Monthly Executive Report'
      );

      const vpAgents = await prisma.agent.findMany({
        where: {
          permissions: { path: '$', array_contains: 'view_all' },
          status: 'active',
        },
      });

      for (const vp of vpAgents) {
        if (vp.personalPhone) {
          await sendTextMessage(vp.personalPhone, digest);
        }
      }
    } catch (err) {
      logger.error(`Monthly digest generation failed: ${err}`);
    }
  });

  logger.info('Digest crons initialized (daily 6PM, weekly Mon 9AM, monthly 1st 9AM)');
}
