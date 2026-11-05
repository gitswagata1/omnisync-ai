import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { webhookRouter } from './api/webhook.js';
import { messagesRouter } from './api/messages.js';
import { schedulesRouter } from './api/schedules.js';
import { agentsRouter } from './api/agents.js';
import { contactsRouter } from './api/contacts.js';
import { analyticsRouter } from './api/analytics.js';
import { initSchedulerEngine } from './services/scheduler-engine.js';
import { setSocketServer } from './services/context-sync.js';
import { setEscalationSocket } from './services/escalation.js';
import { setRouterSocket } from './services/message-router.js';
import { config } from './config/index.js';
import { authenticateHeaders, AuthenticatedAgent } from './middleware/auth.js';
import { logger } from './utils/logger.js';

const app = express();
const server = createServer(app);
const io = new SocketServer(server, {
  cors: { origin: config.dashboardOrigin, credentials: true },
});

app.use(helmet());
app.use(cors({ origin: config.dashboardOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

app.use('/api/webhook', webhookRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/schedules', schedulesRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/analytics', analyticsRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '0.2.0', timestamp: new Date().toISOString() });
});

// Sockets must present a valid session cookie (or Bearer token) during the handshake.
io.use((socket, next) => {
  authenticateHeaders(socket.handshake.headers)
    .then((agent) => {
      if (!agent) {
        next(new Error('unauthorized'));
        return;
      }
      socket.data.agent = agent;
      next();
    })
    .catch(() => next(new Error('unauthorized')));
});

io.on('connection', (socket) => {
  const agent = socket.data.agent as AuthenticatedAgent;
  logger.info(`WebSocket connected: ${socket.id} (agent ${agent.id})`);

  // Each agent may only join their own room.
  void socket.join(`agent:${agent.id}`);

  socket.on('disconnect', () => {
    logger.debug(`WebSocket disconnected: ${socket.id}`);
  });
});

setSocketServer(io);
setEscalationSocket(io);
setRouterSocket(io);

server.listen(config.port, () => {
  logger.info(`OmniSync AI running on port ${config.port}`);
  initSchedulerEngine(io);
});

export { app, io };
