import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';
import type { Server as SocketServer } from 'socket.io';

export type SyncEventType =
  | 'E_INBOUND'
  | 'E_OUTBOUND'
  | 'E_ENTITY'
  | 'E_COMMITMENT'
  | 'E_ESCALATION'
  | 'E_STATUS';

export type Priority = 'CRITICAL' | 'HIGH' | 'IMMEDIATE' | 'NORMAL';

export interface SyncEvent {
  type: SyncEventType;
  contactId: string;
  sourceDepartment: string;
  sourceAgentId: string | null;
  timestamp: Date;
  payload: Record<string, unknown>;
  priority: Priority;
}

let ioInstance: SocketServer | null = null;

export function setSocketServer(io: SocketServer): void {
  ioInstance = io;
}

export async function propagateSyncEvent(event: SyncEvent): Promise<void> {
  logger.info(
    `Propagating sync event: ${event.type} for contact ${event.contactId}`
  );

  const contact = await prisma.contact.findUnique({
    where: { id: event.contactId },
  });

  if (!contact) {
    logger.warn(`Contact ${event.contactId} not found for sync`);
    return;
  }

  const targetDepartments = contact.departments.filter(
    (d) => d !== event.sourceDepartment
  );

  if (targetDepartments.length === 0) return;

  const targetAgents = await prisma.agent.findMany({
    where: {
      department: { in: targetDepartments },
      status: 'active',
    },
  });

  const delta = {
    eventType: event.type,
    contact: {
      id: contact.id,
      name: contact.name,
      organization: contact.organization,
    },
    source: {
      department: event.sourceDepartment,
      agentId: event.sourceAgentId,
    },
    timestamp: event.timestamp.toISOString(),
    payload: event.payload,
    priority: event.priority,
    conflictFlag: null as Record<string, unknown> | null,
  };

  if (event.type === 'E_COMMITMENT') {
    const contextCard = contact.contextCard as Record<string, unknown>;
    const commitments = (contextCard.activeCommitments ?? []) as Array<{
      type: string;
      value: unknown;
      department: string;
    }>;

    const conflicting = commitments.find(
      (k) =>
        k.type === (event.payload.commitmentType as string) &&
        k.value !== event.payload.value &&
        k.department !== event.sourceDepartment
    );

    if (conflicting) {
      delta.conflictFlag = {
        type: 'commitment_conflict',
        departments: [event.sourceDepartment, conflicting.department],
        existing: conflicting.value,
        incoming: event.payload.value,
      };
      delta.priority = 'CRITICAL';

      logger.warn(
        `Commitment conflict detected for contact ${contact.id}: ${event.sourceDepartment} vs ${conflicting.department}`
      );
    }
  }

  if (ioInstance) {
    for (const agent of targetAgents) {
      ioInstance.to(`agent:${agent.id}`).emit('sync_event', delta);
    }
  }

  const shouldNotifyViaWhatsapp =
    event.priority === 'CRITICAL' || event.priority === 'HIGH' || event.priority === 'IMMEDIATE';

  if (shouldNotifyViaWhatsapp) {
    const { sendTextMessage } = await import('../lib/whatsapp.js');
    const summary = `[OmniSync] ${event.type}: ${contact.name ?? contact.phone} — ${JSON.stringify(event.payload).slice(0, 200)}`;

    for (const agent of targetAgents) {
      if (agent.personalPhone) {
        try {
          await sendTextMessage(agent.personalPhone, summary);
        } catch (err) {
          logger.error(
            `Failed to notify agent ${agent.id} via WhatsApp: ${err}`
          );
        }
      }
    }
  }

  const updatedContextCard = { ...(contact.contextCard as Record<string, unknown>) };

  if (event.type === 'E_ENTITY' || event.type === 'E_COMMITMENT' || event.type === 'E_STATUS') {
    const timeline = (updatedContextCard.unifiedTimeline ?? []) as unknown[];
    timeline.push({
      type: event.type,
      source: event.sourceDepartment,
      payload: event.payload,
      timestamp: event.timestamp.toISOString(),
    });
    updatedContextCard.unifiedTimeline = timeline;

    if (event.type === 'E_COMMITMENT') {
      const commitments = (updatedContextCard.activeCommitments ?? []) as Array<Record<string, unknown>>;
      commitments.push({
        type: event.payload.commitmentType,
        value: event.payload.value,
        department: event.sourceDepartment,
        agent: event.sourceAgentId,
        date: event.timestamp.toISOString(),
      });
      updatedContextCard.activeCommitments = commitments;
    }

    await prisma.contact.update({
      where: { id: contact.id },
      data: { contextCard: updatedContextCard },
    });
  }

  await prisma.auditLog.create({
    data: {
      actorAgentId: event.sourceAgentId,
      action: `sync_${event.type.toLowerCase()}`,
      targetType: 'contact',
      targetId: contact.id,
      metadata: delta,
    },
  });
}
