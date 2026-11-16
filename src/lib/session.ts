import jwt, { SignOptions } from 'jsonwebtoken';
import { parseCookie } from 'cookie';
import type { IncomingHttpHeaders } from 'http';
import type { Response } from 'express';
import { config } from '../config/index.js';

export const SESSION_COOKIE = 'omnisync_session';

const isProduction = config.nodeEnv === 'production';

export function generateToken(agentId: string): string {
  return jwt.sign({ agentId }, config.auth.jwtSecret, {
    expiresIn: config.auth.jwtExpiry as SignOptions['expiresIn'],
  });
}

/** Returns the agent id for a valid token, or null if it is invalid or expired. */
export function verifyToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, config.auth.jwtSecret) as { agentId?: unknown };
    return typeof payload.agentId === 'string' ? payload.agentId : null;
  } catch {
    return null;
  }
}

/**
 * Reads the session token from the session cookie. A Bearer header is accepted
 * as well, for API clients and scripts.
 */
export function tokenFromHeaders(headers: IncomingHttpHeaders): string | null {
  const cookies = parseCookie(headers.cookie ?? '');
  if (cookies[SESSION_COOKIE]) return cookies[SESSION_COOKIE];

  const auth = headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

export function setSessionCookie(res: Response, agentId: string): void {
  res.cookie(SESSION_COOKIE, generateToken(agentId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
  });
}
