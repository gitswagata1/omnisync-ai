import crypto from 'crypto';

const SYSTEM_SECRET = process.env.SYSTEM_SECRET || '';

export function generateAuthHash(
  agentId: string,
  role: string,
  department: string
): string {
  return crypto
    .createHmac('sha256', SYSTEM_SECRET)
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
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(hash));
}

export function buildRoleTag(
  company: string,
  userName: string,
  department: string
): string {
  return `${company} | ${userName} | ${department}`;
}
