import { Request, Response, NextFunction } from 'express';
import type { IncomingHttpHeaders } from 'http';
import { prisma } from '../lib/prisma.js';
import { tokenFromHeaders, verifyToken } from '../lib/session.js';

export interface AuthenticatedAgent {
  id: string;
  company: string;
  userName: string;
  role: string;
  department: string;
  permissions: string[];
}

export interface AuthenticatedRequest extends Request {
  agent?: AuthenticatedAgent;
}

/** Resolves the active agent behind a request's session cookie or Bearer token. */
export async function authenticateHeaders(
  headers: IncomingHttpHeaders
): Promise<AuthenticatedAgent | null> {
  const token = tokenFromHeaders(headers);
  if (!token) return null;

  const agentId = verifyToken(token);
  if (!agentId) return null;

  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent || agent.status !== 'active') return null;

  return {
    id: agent.id,
    company: agent.company,
    userName: agent.userName,
    role: agent.role,
    department: agent.department,
    permissions: agent.permissions as string[],
  };
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const agent = await authenticateHeaders(req.headers);
    if (!agent) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    req.agent = agent;
    next();
  } catch (err) {
    next(err);
  }
}
