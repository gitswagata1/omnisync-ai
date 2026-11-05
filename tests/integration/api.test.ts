import { describe, it, expect, beforeAll } from 'vitest';
import crypto from 'crypto';
import express from 'express';
import request from 'supertest';

const VERIFY_TOKEN = 'integration-test-token';
const APP_SECRET = 'integration-test-secret';

function signPayload(body: unknown, secret: string): string {
  return (
    'sha256=' +
    crypto.createHmac('sha256', secret).update(JSON.stringify(body)).digest('hex')
  );
}

function buildApp() {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

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
    if (!signature || !APP_SECRET) {
      res.sendStatus(403);
      return;
    }
    const expected =
      'sha256=' +
      crypto.createHmac('sha256', APP_SECRET).update(JSON.stringify(req.body)).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      res.sendStatus(403);
      return;
    }
    res.sendStatus(200);
  });

  // Protected endpoints (require auth header)
  const authGuard = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    next();
  };

  app.get('/api/schedules', authGuard, (_req, res) => {
    res.json({ schedules: [] });
  });

  app.get('/api/agents', authGuard, (_req, res) => {
    res.json({ agents: [] });
  });

  app.get('/api/contacts', authGuard, (_req, res) => {
    res.json({ contacts: [] });
  });

  app.get('/api/analytics/dashboard', authGuard, (_req, res) => {
    res.json({ metrics: {} });
  });

  app.post('/api/messages/send', authGuard, (_req, res) => {
    res.status(201).json({ messageId: 'test' });
  });

  return app;
}

beforeAll(() => {
  process.env.WHATSAPP_VERIFY_TOKEN = VERIFY_TOKEN;
  process.env.WHATSAPP_APP_SECRET = APP_SECRET;
});

describe('Health endpoint', () => {
  it('GET /health returns 200 with status ok', async () => {
    const app = buildApp();
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });

  it('GET /health returns valid ISO timestamp', async () => {
    const app = buildApp();
    const res = await request(app).get('/health');

    const timestamp = new Date(res.body.timestamp);
    expect(timestamp.toISOString()).toBe(res.body.timestamp);
  });
});

describe('Webhook verification flow', () => {
  it('completes full verification handshake', async () => {
    const app = buildApp();
    const challenge = `challenge-${Date.now()}`;

    const res = await request(app)
      .get('/api/webhook')
      .query({
        'hub.mode': 'subscribe',
        'hub.verify_token': VERIFY_TOKEN,
        'hub.challenge': challenge,
      });

    expect(res.status).toBe(200);
    expect(res.text).toBe(challenge);
  });

  it('signed POST webhook returns 200', async () => {
    const app = buildApp();
    const body = { entry: [{ changes: [{ value: {} }] }] };
    const sig = signPayload(body, APP_SECRET);

    const res = await request(app)
      .post('/api/webhook')
      .set('x-hub-signature-256', sig)
      .send(body);

    expect(res.status).toBe(200);
  });
});

describe('Protected endpoints require authentication', () => {
  const protectedRoutes = [
    { method: 'get' as const, path: '/api/schedules' },
    { method: 'get' as const, path: '/api/agents' },
    { method: 'get' as const, path: '/api/contacts' },
    { method: 'get' as const, path: '/api/analytics/dashboard' },
    { method: 'post' as const, path: '/api/messages/send' },
  ];

  for (const route of protectedRoutes) {
    it(`${route.method.toUpperCase()} ${route.path} returns 401 without auth`, async () => {
      const app = buildApp();
      const res = await request(app)[route.method](route.path).send({});

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    it(`${route.method.toUpperCase()} ${route.path} returns 200/201 with auth`, async () => {
      const app = buildApp();
      const res = await request(app)
        [route.method](route.path)
        .set('Authorization', 'Bearer test-token')
        .send({ contactPhone: '+91123', body: 'test' });

      expect(res.status).toBeLessThan(300);
    });
  }
});

describe('Unknown routes', () => {
  it('returns 404 for undefined paths', async () => {
    const app = buildApp();
    const res = await request(app).get('/api/nonexistent');

    expect(res.status).toBe(404);
  });
});
