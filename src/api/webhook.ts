import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { config } from '../config/index.js';
import { demultiplexInbound } from '../services/message-router.js';
import { handleScheduleResponse } from '../services/scheduler-engine.js';
import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';

export const webhookRouter = Router();

// Use raw body for signature verification
webhookRouter.use((req: Request, _res, next) => {
  (req as Request & { rawBody?: string }).rawBody = JSON.stringify(req.body);
  next();
});

webhookRouter.get('/', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.whatsapp.verifyToken) {
    logger.info('Webhook verified');
    res.status(200).send(challenge);
    return;
  }

  res.sendStatus(403);
});

webhookRouter.post('/', async (req: Request, res: Response) => {
  const signature = req.headers['x-hub-signature-256'] as string;
  if (!verifySignature(req.body, signature)) {
    logger.warn('Webhook signature verification failed');
    res.sendStatus(403);
    return;
  }

  // Respond immediately to Meta (they require 200 within 20s)
  res.sendStatus(200);

  try {
    const entry = req.body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (value?.messages) {
      for (const message of value.messages) {
        const senderPhone = message.from as string;
        const messageType = message.type as string;
        const waMessageId = message.id as string;

        let body = '';
        let mediaId: string | undefined;

        switch (messageType) {
          case 'text':
            body = message.text?.body ?? '';
            break;
          case 'audio':
            mediaId = message.audio?.id;
            break;
          case 'image':
            mediaId = message.image?.id;
            body = message.image?.caption ?? '';
            break;
          case 'document':
            mediaId = message.document?.id;
            body = message.document?.caption ?? '';
            break;
          case 'video':
            mediaId = message.video?.id;
            body = message.video?.caption ?? '';
            break;
        }

        // Check if this is a response to a scheduled message
        const isScheduleResponse = await handleScheduleResponse(
          senderPhone,
          body || '[media message]'
        );

        if (!isScheduleResponse) {
          await demultiplexInbound(
            senderPhone,
            body,
            messageType,
            waMessageId,
            mediaId
          );
        }
      }
    }

    if (value?.statuses) {
      for (const status of value.statuses) {
        await prisma.message.updateMany({
          where: { waMessageId: status.id },
          data: { deliveryStatus: status.status },
        });
      }
    }
  } catch (err) {
    logger.error(`Webhook processing error: ${err}`);
  }
});

function verifySignature(body: unknown, signature: string): boolean {
  if (!signature || !config.whatsapp.appSecret) return false;

  const expectedSignature =
    'sha256=' +
    crypto
      .createHmac('sha256', config.whatsapp.appSecret)
      .update(JSON.stringify(body))
      .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
