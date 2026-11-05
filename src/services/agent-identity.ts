import crypto from 'crypto';
import { config } from '../config/index.js';

export function generateAuthHash(
  agentId: string,
  role: string,
  department: string
): string {
  return crypto
    .createHmac('sha256', config.auth.systemSecret)
    .update(`${agentId}${role}${department}`)
    .digest('hex');
}

export function verifyAuthHash(
  agentId: string,
  role: string,
  department: string,
  hash: string
): boolean {
  const expected = generateAuthHash(agentId, role, department);
  if (expected.length !== hash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(hash));
}

export function buildRoleTag(
  company: string,
  userName: string,
  department: string
): string {
  return `${company} | ${userName} | ${department}`;
}
