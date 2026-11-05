import { describe, it, expect, beforeAll } from 'vitest';
import crypto from 'crypto';
import express from 'express';
import request from 'supertest';

const APP_SECRET = 'test-app-secret-for-webhook';
const VERIFY_TOKEN = 'test-verify-token';

function signPayload(body: unknown, secret: string): string {
  return (
    'sha256=' +
    crypto.createHmac('sha256', secret).update(JSON.stringify(body)).digest('hex')
  );
}

function verifySignature(body: unknown, signature: string, secret: string): boolean {
  if (!signature || !secret) return false;
  const expected =
    'sha256=' +
    crypto.createHmac('sha256', secret).update(JSON.stringify(body)).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

function buildWebhookApp() {
  const app = express();
  app.use(express.json());

  app.get('/api/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      res.status(200).send(challenge);
      return;
    }
    res.sendStatus(403);
  });

  app.post('/api/webhook', (req, res) => {
    const signature = req.headers['x-hub-signature-256'] as string;
    if (!verifySignature(req.body, signature, APP_SECRET)) {
      res.sendStatus(403);
      return;
    }
    res.sendStatus(200);
  });

  return app;
}

beforeAll(() => {
  process.env.WHATSAPP_APP_SECRET = APP_SECRET;
  process.env.WHATSAPP_VERIFY_TOKEN = VERIFY_TOKEN;
});

describe('GET /api/webhook (verification)', () => {
  it('returns challenge when verify token matches', async () => {
    const app = buildWebhookApp();
    const res = await request(app)
      .get('/api/webhook')
      .query({
        'hub.mode': 'subscribe',
        'hub.verify_token': VERIFY_TOKEN,
        'hub.challenge': 'test-challenge-123',
      });

    expect(res.status).toBe(200);
    expect(res.text).toBe('test-challenge-123');
  });

  it('returns 403 when verify token does not match', async () => {
    const app = buildWebhookApp();
    const res = await request(app)
      .get('/api/webhook')
      .query({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'wrong-token',
        'hub.challenge': 'test-challenge-123',
      });

    expect(res.status).toBe(403);
  });

  it('returns 403 when hub.mode is not subscribe', async () => {
    const app = buildWebhookApp();
    const res = await request(app)
      .get('/api/webhook')
      .query({
        'hub.mode': 'unsubscribe',
        'hub.verify_token': VERIFY_TOKEN,
        'hub.challenge': 'test-challenge-123',
      });

    expect(res.status).toBe(403);
  });
});

describe('POST /api/webhook (message reception)', () => {
  it('returns 200 for a valid signed payload', async () => {
    const app = buildWebhookApp();
    const body = {
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  { from: '919876543210', type: 'text', text: { body: 'hello' } },
                ],
              },
            },
          ],
        },
      ],
    };

    const signature = signPayload(body, APP_SECRET);

    const res = await request(app)
      .post('/api/webhook')
      .set('x-hub-signature-256', signature)
      .send(body);

    expect(res.status).toBe(200);
  });

  it('returns 403 for an invalid signature', async () => {
    const app = buildWebhookApp();
    const body = { entry: [{ changes: [{ value: {} }] }] };

    const res = await request(app)
      .post('/api/webhook')
      .set('x-hub-signature-256', 'sha256=0000000000000000000000000000000000000000000000000000000000000000')
      .send(body);

    expect(res.status).toBe(403);
  });

  it('returns 403 when signature header is missing', async () => {
    const app = buildWebhookApp();
    const body = { entry: [{ changes: [{ value: {} }] }] };

    const res = await request(app).post('/api/webhook').send(body);

    expect(res.status).toBe(403);
  });

  it('returns 200 for status update payloads', async () => {
    const app = buildWebhookApp();
    const body = {
      entry: [
        {
          changes: [
            {
              value: {
                statuses: [{ id: 'wamid.123', status: 'delivered' }],
              },
            },
          ],
        },
      ],
    };

    const signature = signPayload(body, APP_SECRET);

    const res = await request(app)
      .post('/api/webhook')
      .set('x-hub-signature-256', signature)
      .send(body);

    expect(res.status).toBe(200);
  });
});

describe('Signature verification logic', () => {
  it('verifySignature returns true for matching signature', () => {
    const body = { test: 'data' };
    const sig = signPayload(body, APP_SECRET);
    expect(verifySignature(body, sig, APP_SECRET)).toBe(true);
  });

  it('verifySignature returns false for different body', () => {
    const body1 = { test: 'data1' };
    const body2 = { test: 'data2' };
    const sig = signPayload(body1, APP_SECRET);
    expect(verifySignature(body2, sig, APP_SECRET)).toBe(false);
  });

  it('verifySignature returns false for different secret', () => {
    const body = { test: 'data' };
    const sig = signPayload(body, 'different-secret');
    expect(verifySignature(body, sig, APP_SECRET)).toBe(false);
  });

  it('verifySignature returns false for empty signature', () => {
    const body = { test: 'data' };
    expect(verifySignature(body, '', APP_SECRET)).toBe(false);
  });

  it('verifySignature returns false for empty secret', () => {
    const body = { test: 'data' };
    const sig = signPayload(body, APP_SECRET);
    expect(verifySignature(body, sig, '')).toBe(false);
  });
});
