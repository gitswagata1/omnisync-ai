import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { sendTextMessage, markAsRead } from '../lib/whatsapp.js';
import { buildRoleTag, verifyAuthHash } from './agent-identity.js';
import { analyzeInboundMessage } from './llm-evaluator.js';
import { transcribeAudio } from './transcription.js';
import { propagateSyncEvent } from './context-sync.js';
import { logger } from '../utils/logger.js';
import type { Server as SocketServer } from 'socket.io';

let ioInstance: SocketServer | null = null;

export function setRouterSocket(io: SocketServer): void {
  ioInstance = io;
}

export async function demultiplexInbound(
  senderPhone: string,
  messageBody: string,
  messageType: string,
  waMessageId: string,
  mediaId?: string
): Promise<void> {
  logger.info(`Demultiplexing inbound from ${senderPhone}, type=${messageType}`);

  let contact = await prisma.contact.findUnique({
    where: { phone: senderPhone },
  });

  if (!contact) {
    contact = await prisma.contact.create({
      data: {
        phone: senderPhone,
        departments: ['Unassigned'],
        contextCard: {},
      },
    });
    logger.info(`Created new contact for ${senderPhone}`);
  }

  let transcript: string | undefined;
  if (messageType === 'audio' && mediaId) {
    try {
      transcript = await transcribeAudio(mediaId);
    } catch (err) {
      logger.error(`Transcription failed: ${err}`);
    }
  }

  const textContent = transcript ?? messageBody;

  let conversation = await prisma.conversation.findFirst({
    where: { contactId: contact.id, status: 'active' },
    orderBy: { lastMessageAt: 'desc' },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        contactId: contact.id,
        department: contact.departments[0],
      },
    });
  }

  let llmAnalysis: Record<string, unknown> | null = null;
  if (textContent) {
    try {
      llmAnalysis = await analyzeInboundMessage(
        textContent,
        contact.name ?? senderPhone,
        contact.organization ?? 'Unknown'
      );
    } catch (err) {
      logger.error(`LLM analysis failed: ${err}`);
    }
  }

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      waMessageId,
      direction: 'inbound',
      senderPhone,
      messageType,
      body: messageBody,
      transcript,
      llmAnalysis: llmAnalysis ? (llmAnalysis as Prisma.InputJsonValue) : Prisma.JsonNull,
      deliveryStatus: 'delivered',
    },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: new Date(),
      messageCount: { increment: 1 },
    },
  });

  const targetAgents = await prisma.agent.findMany({
    where: {
      department: { in: contact.departments },
      status: 'active',
    },
  });

  if (ioInstance) {
    const payload = {
      messageId: message.id,
      contactId: contact.id,
      contactName: contact.name ?? senderPhone,
      contactOrg: contact.organization,
      body: textContent,
      messageType,
      llmAnalysis: llmAnalysis ? (llmAnalysis as Prisma.InputJsonValue) : Prisma.JsonNull,
      timestamp: message.createdAt.toISOString(),
    };

    for (const agent of targetAgents) {
      ioInstance.to(`agent:${agent.id}`).emit('inbound_message', payload);
    }
  }

  try {
    await markAsRead(waMessageId);
  } catch {
    // non-critical
  }

  await propagateSyncEvent({
    type: 'E_INBOUND',
    contactId: contact.id,
    sourceDepartment: contact.departments[0] ?? 'Unassigned',
    sourceAgentId: null,
    timestamp: new Date(),
    payload: {
      messageId: message.id,
      body: textContent?.slice(0, 200),
      messageType,
      intent: (llmAnalysis?.intent) ?? null,
      urgency: (llmAnalysis?.urgency) ?? null,
    },
    priority:
      (llmAnalysis?.urgency as number) >= 4 ? 'CRITICAL' : 'IMMEDIATE',
  });

  await prisma.auditLog.create({
    data: {
      action: 'message_received',
      targetType: 'message',
      targetId: message.id,
      metadata: {
        from: senderPhone,
        type: messageType,
        contactId: contact.id,
      },
    },
  });
}

export async function multiplexOutbound(
  agentId: string,
  contactPhone: string,
  messageBody: string
): Promise<{ messageId: string; waMessageId: string; collision?: boolean }> {
  logger.info(`Multiplexing outbound from agent ${agentId} to ${contactPhone}`);

  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) throw new Error('Agent not found');

  if (!verifyAuthHash(agent.id, agent.role, agent.department, agent.authHash)) {
    throw new Error('Agent identity verification failed');
  }

  const contact = await prisma.contact.findUnique({
    where: { phone: contactPhone },
  });
  if (!contact) throw new Error('Contact not found');

  const hasPermission =
    (agent.permissions as string[]).includes('send_all') ||
    contact.departments.includes(agent.department) ||
    contact.assignedAgentIds.includes(agent.id);

  if (!hasPermission) {
    throw new Error('Agent does not have send permission for this contact');
  }

  // Collision detection
  const collisionWindow = new Date(Date.now() - 4 * 60 * 60 * 1000);
  const recentOutbound = await prisma.message.findFirst({
    where: {
      direction: 'outbound',
      senderAgentId: { not: agentId },
      conversation: { contactId: contact.id },
      createdAt: { gte: collisionWindow },
    },
    include: { senderAgent: true },
    orderBy: { createdAt: 'desc' },
  });

  const collision = !!recentOutbound;

  const roleTag = buildRoleTag(agent.company, agent.userName, agent.department);
  const taggedMessage = `[${roleTag}]\n${messageBody}`;

  const waMessageId = await sendTextMessage(contactPhone, taggedMessage);

  let conversation = await prisma.conversation.findFirst({
    where: { contactId: contact.id, status: 'active' },
    orderBy: { lastMessageAt: 'desc' },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        contactId: contact.id,
        department: agent.department,
      },
    });
  }

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      waMessageId,
      direction: 'outbound',
      senderAgentId: agentId,
      senderPhone: contactPhone,
      messageType: 'text',
      body: messageBody,
      deliveryStatus: 'sent',
    },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: new Date(),
      messageCount: { increment: 1 },
    },
  });

  // Broadcast to peer agents
  const peerAgents = await prisma.agent.findMany({
    where: {
      department: { in: contact.departments },
      status: 'active',
      id: { not: agentId },
    },
  });

  if (ioInstance) {
    const payload = {
      messageId: message.id,
      contactId: contact.id,
      contactName: contact.name ?? contactPhone,
      agentName: agent.userName,
      agentRoleTag: roleTag,
      body: messageBody.slice(0, 200),
      timestamp: message.createdAt.toISOString(),
    };

    for (const peer of peerAgents) {
      ioInstance.to(`agent:${peer.id}`).emit('outbound_broadcast', payload);
    }
  }

  await propagateSyncEvent({
    type: 'E_OUTBOUND',
    contactId: contact.id,
    sourceDepartment: agent.department,
    sourceAgentId: agentId,
    timestamp: new Date(),
    payload: {
      messageId: message.id,
      body: messageBody.slice(0, 200),
      agentRoleTag: roleTag,
    },
    priority: 'IMMEDIATE',
  });

  await prisma.auditLog.create({
    data: {
      actorAgentId: agentId,
      action: 'message_sent',
      targetType: 'message',
      targetId: message.id,
      metadata: {
        to: contactPhone,
        contactId: contact.id,
        waMessageId,
      },
    },
  });

  return { messageId: message.id, waMessageId, collision };
}
