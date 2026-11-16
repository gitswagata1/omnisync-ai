import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// Config is read at import time, so the environment must be set first.
process.env.JWT_SECRET = 'unit-test-jwt-secret-at-least-32-chars-long';
process.env.JWT_EXPIRY = '1h';

const PASSWORD = 'correct-horse-battery';

type Agent = {
  id: string;
  email: string;
  passwordHash: string | null;
  status: string;
  company: string;
  userName: string;
  role: string;
  department: string;
  roleTag: string;
  permissions: string[];
};

const store: { agents: Agent[] } = { agents: [] };

vi.mock('../../src/lib/prisma.js', () => {
  const findUnique = vi.fn(async ({ where }: { where: { id?: string; email?: string } }) => {
    return (
      store.agents.find((a) =>
        where.id !== undefined ? a.id === where.id : a.email === where.email
      ) ?? null
    );
  });
  return {
    prisma: {
      agent: { findUnique, findFirst: vi.fn(async () => null), create: vi.fn() },
      auditLog: { create: vi.fn(async () => ({})) },
    },
  };
});

let agentsRouter: express.Router;
let generateToken: (id: string) => string;
let hashPassword: (p: string) => Promise<string>;
let tokenFromHeaders: (h: Record<string, string | undefined>) => string | null;

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/agents', agentsRouter);
  return app;
}

function makeAgent(overrides: Partial<Agent> = {}): Agent {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'swagata@microturner.test',
    passwordHash: null,
    status: 'active',
    company: 'Micro Turner',
    userName: 'Swagata',
    role: 'Purchase Manager',
    department: 'Purchase',
    roleTag: 'Micro Turner | Swagata | Purchase',
    permissions: ['send_vendor'],
    ...overrides,
  };
}

beforeAll(async () => {
  ({ agentsRouter } = await import('../../src/api/agents.js'));
  ({ generateToken } = await import('../../src/lib/session.js'));
  ({ tokenFromHeaders } = await import('../../src/lib/session.js'));
  ({ hashPassword } = await import('../../src/lib/password.js'));
}, 30000);

beforeEach(async () => {
  store.agents = [];
});

describe('password helpers', () => {
  it('verifies the right password and rejects a wrong one', async () => {
    const { hashPassword: hash, verifyPassword } = await import('../../src/lib/password.js');
    const stored = await hash(PASSWORD);
    expect(stored).not.toBe(PASSWORD);
    expect(await verifyPassword(PASSWORD, stored)).toBe(true);
    expect(await verifyPassword('wrong-password-value', stored)).toBe(false);
  }, 30000);

  it('rejects any password when no hash is stored', async () => {
    const { verifyPassword } = await import('../../src/lib/password.js');
    expect(await verifyPassword(PASSWORD, null)).toBe(false);
  }, 30000);
});

describe('session helpers', () => {
  it('reads the session token from the cookie', () => {
    expect(tokenFromHeaders({ cookie: 'other=1; omnisync_session=abc.def.ghi' })).toBe('abc.def.ghi');
  });

  it('falls back to a Bearer token', () => {
    expect(tokenFromHeaders({ authorization: 'Bearer xyz' })).toBe('xyz');
  });

  it('returns null when no token is present', () => {
    expect(tokenFromHeaders({})).toBeNull();
  });
});

describe('POST /api/agents/login', () => {
  it('sets an HTTP-only session cookie and does not return a token', async () => {
    store.agents = [makeAgent({ passwordHash: await hashPassword(PASSWORD) })];

    const res = await request(buildApp())
      .post('/api/agents/login')
      .send({ email: 'swagata@microturner.test', password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.agent.userName).toBe('Swagata');
    expect(res.body.token).toBeUndefined();
    const cookie = res.headers['set-cookie'] as unknown as string[];
    expect(cookie.some((c) => c.startsWith('omnisync_session=') && c.includes('HttpOnly'))).toBe(true);
  }, 30000);

  it('rejects a wrong password with a generic message', async () => {
    store.agents = [makeAgent({ passwordHash: await hashPassword(PASSWORD) })];

    const res = await request(buildApp())
      .post('/api/agents/login')
      .send({ email: 'swagata@microturner.test', password: 'not-the-password' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  }, 30000);

  it('gives the same response for an unknown email', async () => {
    const res = await request(buildApp())
      .post('/api/agents/login')
      .send({ email: 'nobody@microturner.test', password: PASSWORD });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });

  it('rejects inactive agents even with the right password', async () => {
    store.agents = [makeAgent({ passwordHash: await hashPassword(PASSWORD), status: 'inactive' })];

    const res = await request(buildApp())
      .post('/api/agents/login')
      .send({ email: 'swagata@microturner.test', password: PASSWORD });

    expect(res.status).toBe(401);
  }, 30000);

  it('rejects the old UUID-only login body', async () => {
    const res = await request(buildApp())
      .post('/api/agents/login')
      .send({ agentId: '11111111-1111-4111-8111-111111111111' });

    expect(res.status).toBe(400);
  });
});

describe('session-protected routes', () => {
  it('returns 401 from /me without a session', async () => {
    const res = await request(buildApp()).get('/api/agents/me');
    expect(res.status).toBe(401);
  });

  it('returns the current agent from /me with a valid session cookie', async () => {
    const agent = makeAgent();
    store.agents = [agent];
    const token = generateToken(agent.id);

    const res = await request(buildApp())
      .get('/api/agents/me')
      .set('Cookie', `omnisync_session=${token}`);

    expect(res.status).toBe(200);
    expect(res.body.agent.email).toBe(agent.email);
  });

  it('rejects a forged session token', async () => {
    const agent = makeAgent();
    store.agents = [agent];

    const res = await request(buildApp())
      .get('/api/agents/me')
      .set('Cookie', 'omnisync_session=not.a.real.token');

    expect(res.status).toBe(401);
  });

  it('refuses agent creation from a non-admin agent', async () => {
    const agent = makeAgent();
    store.agents = [agent];
    const token = generateToken(agent.id);

    const res = await request(buildApp())
      .post('/api/agents')
      .set('Cookie', `omnisync_session=${token}`)
      .send({
        userName: 'New Person',
        role: 'Clerk',
        department: 'Purchase',
        email: 'new@microturner.test',
        password: 'a-long-enough-password',
        permissions: ['view_all'],
      });

    expect(res.status).toBe(403);
  });

  it('refuses agent creation without any session', async () => {
    const res = await request(buildApp())
      .post('/api/agents')
      .send({
        userName: 'Attacker',
        role: 'Admin',
        department: 'Purchase',
        email: 'attacker@example.test',
        password: 'a-long-enough-password',
        permissions: ['view_all'],
      });

    expect(res.status).toBe(401);
  });
});

describe('POST /api/agents/logout', () => {
  it('clears the session cookie', async () => {
    const res = await request(buildApp()).post('/api/agents/logout');
    expect(res.status).toBe(204);
    const cookie = res.headers['set-cookie'] as unknown as string[];
    expect(cookie.some((c) => c.startsWith('omnisync_session=;'))).toBe(true);
  });
});
