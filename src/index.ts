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
import { logger } from './utils/logger.js';

const app = express();
const server = createServer(app);
const io = new SocketServer(server, {
  cors: { origin: '*' },
});

app.use(helmet());
app.use(cors());
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

io.on('connection', (socket) => {
  logger.info(`WebSocket connected: ${socket.id}`);

  socket.on('join_agent', (agentId: string) => {
    void socket.join(`agent:${agentId}`);
    logger.debug(`Socket ${socket.id} joined agent:${agentId}`);
  });

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
