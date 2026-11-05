import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/index.js';
import { prisma } from '../lib/prisma.js';

export interface AuthenticatedRequest extends Request {
  agent?: {
    id: string;
    company: string;
    userName: string;
    role: string;
    department: string;
    permissions: string[];
  };
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization header' });
    return;
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, config.auth.jwtSecret) as {
      agentId: string;
    };

    const agent = await prisma.agent.findUnique({
      where: { id: payload.agentId },
    });

    if (!agent || agent.status !== 'active') {
      res.status(401).json({ error: 'Agent not found or inactive' });
      return;
    }

    req.agent = {
      id: agent.id,
      company: agent.company,
      userName: agent.userName,
      role: agent.role,
      department: agent.department,
      permissions: agent.permissions as string[],
    };

    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function generateToken(agentId: string): string {
  return jwt.sign({ agentId }, config.auth.jwtSecret, {
    expiresIn: config.auth.jwtExpiry as SignOptions["expiresIn"],
  });
}
