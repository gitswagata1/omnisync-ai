import { prisma } from '../lib/prisma.js';
import { sendTemplateMessage } from '../lib/whatsapp.js';
import { propagateSyncEvent } from './context-sync.js';
import { SchedulerState } from './scheduler-fsm.js';
import { logger } from '../utils/logger.js';
import type { Server as SocketServer } from 'socket.io';

let ioInstance: SocketServer | null = null;

export function setEscalationSocket(io: SocketServer): void {
  ioInstance = io;
}

export async function triggerEscalation(
  scheduleId: string,
  reason: string
): Promise<void> {
  logger.info(`Escalation triggered for schedule ${scheduleId}: ${reason}`);

  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    include: { agent: true },
  });

  if (!schedule) {
    logger.error(`Schedule ${scheduleId} not found for escalation`);
    return;
  }

  const escalationConfig = schedule.escalationConfig as {
    enabled?: boolean;
    escalateTo?: string;
    escalationTemplate?: string;
  } | null;

  if (!escalationConfig?.enabled || !escalationConfig.escalateTo) {
    logger.warn(`No escalation config for schedule ${scheduleId}, pausing instead`);
    await prisma.schedule.update({
      where: { id: scheduleId },
      data: { status: SchedulerState.ERROR.toLowerCase() },
    });
    return;
  }

  let waMessageId: string | undefined;
  try {
    waMessageId = await sendTemplateMessage(
      escalationConfig.escalateTo,
      escalationConfig.escalationTemplate ?? 'escalation_no_response',
      'en',
      [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: schedule.recipientName ?? schedule.recipientPhone },
            { type: 'text', text: schedule.name },
            { type: 'text', text: schedule.lastRunAt?.toLocaleString() ?? 'Unknown' },
          ],
        },
      ]
    );
  } catch (err) {
    logger.error(`Failed to send escalation message: ${err}`);
  }

  const escalation = await prisma.escalation.create({
    data: {
      triggerType: 'no_response',
      sourceId: scheduleId,
      escalatedTo: escalationConfig.escalateTo,
      escalationMsg: `No response from ${schedule.recipientName ?? schedule.recipientPhone} regarding "${schedule.name}". Reason: ${reason}`,
      status: 'sent',
    },
  });

  await prisma.schedule.update({
    where: { id: scheduleId },
    data: { status: SchedulerState.ESCALATED.toLowerCase() },
  });

  await prisma.scheduleLog.create({
    data: {
      scheduleId,
      status: 'escalated',
      waMessageId,
      errorMessage: reason,
    },
  });

  if (ioInstance) {
    ioInstance.emit('escalation', {
      escalationId: escalation.id,
      scheduleId,
      scheduleName: schedule.name,
      recipientName: schedule.recipientName,
      reason,
      timestamp: new Date().toISOString(),
    });
  }

  // Fire sync event if there's a contact associated
  const contact = await prisma.contact.findFirst({
    where: { phone: schedule.recipientPhone },
  });

  if (contact) {
    await propagateSyncEvent({
      type: 'E_ESCALATION',
      contactId: contact.id,
      sourceDepartment: schedule.agent?.department ?? 'System',
      sourceAgentId: schedule.agentId,
      timestamp: new Date(),
      payload: {
        scheduleId,
        scheduleName: schedule.name,
        reason,
        escalatedTo: escalationConfig.escalateTo,
      },
      priority: 'CRITICAL',
    });
  }

  await prisma.auditLog.create({
    data: {
      actorAgentId: schedule.agentId,
      action: 'escalation_triggered',
      targetType: 'schedule',
      targetId: scheduleId,
      metadata: { reason, escalationId: escalation.id },
    },
  });
}
