import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { logger } from '../utils/logger.js';

export const webhookRouter = Router();

webhookRouter.get('/', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    logger.info('Webhook verified');
    res.status(200).send(challenge);
    return;
  }

  res.sendStatus(403);
});

webhookRouter.post('/', (req: Request, res: Response) => {
  const signature = req.headers['x-hub-signature-256'] as string;
  if (!verifySignature(req.body, signature)) {
    logger.warn('Webhook signature verification failed');
    res.sendStatus(403);
    return;
  }

  const entry = req.body?.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;

  if (value?.messages) {
    for (const message of value.messages) {
      logger.info(`Inbound message from ${message.from}: ${message.type}`);
      // TODO: Route through inbound pipeline
      // 1. Contact lookup + department routing
      // 2. Media download + transcription (if audio)
      // 3. LLM analysis (intent, urgency, entities)
      // 4. Store in DB
      // 5. Notify agents via WebSocket + WhatsApp forward
    }
  }

  if (value?.statuses) {
    for (const status of value.statuses) {
      logger.debug(`Message ${status.id}: ${status.status}`);
      // TODO: Update delivery status in DB
    }
  }

  res.sendStatus(200);
});

function verifySignature(body: unknown, signature: string): boolean {
  if (!signature || !process.env.WHATSAPP_APP_SECRET) return false;

  const expectedSignature =
    'sha256=' +
    crypto
      .createHmac('sha256', process.env.WHATSAPP_APP_SECRET)
      .update(JSON.stringify(body))
      .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
