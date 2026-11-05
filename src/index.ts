import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { webhookRouter } from './api/webhook.js';
import { messagesRouter } from './api/messages.js';
import { schedulesRouter } from './api/schedules.js';
import { agentsRouter } from './api/agents.js';
import { contactsRouter } from './api/contacts.js';
import { analyticsRouter } from './api/analytics.js';
import { initSchedulerEngine } from './services/scheduler-engine.js';
import { logger } from './utils/logger.js';

const app = express();
const server = createServer(app);
const io = new SocketServer(server, { cors: { origin: '*' } });

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/webhook', webhookRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/schedules', schedulesRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/analytics', analyticsRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  logger.info(`OmniSync AI running on port ${PORT}`);
  initSchedulerEngine(io);
});

export { app, io };
