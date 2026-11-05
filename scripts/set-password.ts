/**
 * Sets an agent's login password.
 *
 *   AGENT_EMAIL=someone@example.com AGENT_PASSWORD='...' npx tsx scripts/set-password.ts
 *
 * The password is read from the environment rather than argv, so it does not
 * end up in shell history or process listings.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { hashPassword, MIN_PASSWORD_LENGTH } from '../src/lib/password.js';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // Find the agent by email, or by id when migrating an existing agent that has no email yet.
  // In the id case, AGENT_EMAIL also sets the agent's email.
  const agentId = process.env.AGENT_ID?.trim();
  const email = process.env.AGENT_EMAIL?.trim().toLowerCase();
  const password = process.env.AGENT_PASSWORD;

  if ((!agentId && !email) || !password) {
    throw new Error('Set AGENT_PASSWORD and either AGENT_EMAIL or AGENT_ID.');
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }

  const agent = agentId
    ? await prisma.agent.findUnique({ where: { id: agentId } })
    : await prisma.agent.findUnique({ where: { email: email as string } });
  if (!agent) {
    throw new Error(`No matching agent found.`);
  }

  await prisma.agent.update({
    where: { id: agent.id },
    data: {
      passwordHash: await hashPassword(password),
      ...(agentId && email ? { email } : {}),
    },
  });
  console.log(`Password updated for agent ${agent.id}.`);
}

main()
  .catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
