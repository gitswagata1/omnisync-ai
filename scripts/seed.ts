import { PrismaClient } from '@prisma/client';
import crypto, { randomBytes } from 'crypto';
import { hashPassword } from '../src/lib/password.js';

const prisma = new PrismaClient();

const SYSTEM_SECRET = process.env.SYSTEM_SECRET || 'dev-secret-change-in-production';

function hashAgent(id: string, role: string, dept: string): string {
  return crypto
    .createHmac('sha256', SYSTEM_SECRET)
    .update(`${id}${role}${dept}`)
    .digest('hex');
}

const AGENTS = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    company: 'Micro Turner',
    userName: 'Swagata',
    role: 'Purchase Manager',
    department: 'Purchase',
    personalPhone: '+919876543210',
    permissions: ['send_client', 'send_vendor', 'view_all'],
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    company: 'Micro Turner',
    userName: 'Amit',
    role: 'Sales Lead',
    department: 'Sales',
    personalPhone: '+919876543211',
    permissions: ['send_client', 'view_all'],
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    company: 'Micro Turner',
    userName: 'Rajesh',
    role: 'Maintenance Head',
    department: 'Maintenance',
    personalPhone: '+919876543212',
    permissions: ['send_vendor'],
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    company: 'Micro Turner',
    userName: 'VP Operations',
    role: 'Vice President',
    department: 'Management',
    personalPhone: '+919876500002',
    permissions: ['view_all'],
  },
];

const CONTACTS = [
  {
    phone: '+4915112345678',
    name: 'Hans Mueller',
    organization: 'Mercedes-Benz',
    contactType: 'client',
    departments: ['Purchase', 'Sales', 'Quality'],
  },
  {
    phone: '+4917612345678',
    name: 'Klaus Weber',
    organization: 'Bosch',
    contactType: 'vendor',
    departments: ['Purchase'],
  },
  {
    phone: '+912212345678',
    name: 'Priya Sharma',
    organization: 'Tata Motors',
    contactType: 'client',
    departments: ['Sales', 'Quality', 'Logistics'],
  },
];

const SCHEDULES = [
  {
    name: 'Daily Maintenance Check — CNC Bay 3',
    scheduleType: 'maintenance',
    cronExpression: '0 8 * * 1-6',
    recipientPhone: '+919876543212',
    recipientName: 'Rajesh (Maintenance Head)',
    messageTemplate: 'maintenance_daily_reminder',
    templateVars: { '1': 'CNC Bay 3', '2': '{{date}}' },
    expectedCriteria: 'Status report of machine condition with any issues noted',
    escalationConfig: {
      enabled: true,
      ifNoReplyWithin: 7200,
      escalateTo: '+919876500002',
      escalationTemplate: 'escalation_no_response',
    },
  },
  {
    name: 'Weekly Purchase Wrap-up',
    scheduleType: 'report_request',
    cronExpression: '0 9 * * 1',
    recipientPhone: '+919876543210',
    recipientName: 'Swagata (Purchase)',
    messageTemplate: 'executive_daily_digest',
    templateVars: { body: 'Please submit your weekly purchase summary covering all vendor interactions and PO statuses.' },
    expectedCriteria: 'Summary of vendor interactions with PO numbers and statuses',
    escalationConfig: null,
  },
];

async function seed(): Promise<void> {
  console.log('Seeding OmniSync AI database...\n');

  console.log('--- Agents ---');
  const newCredentials: { email: string; password: string }[] = [];
  for (const data of AGENTS) {
    const authHash = hashAgent(data.id, data.role, data.department);
    const roleTag = `${data.company} | ${data.userName} | ${data.department}`;
    const email = `${data.userName.toLowerCase().replace(/\s+/g, '.')}@microturner.test`;

    const existing = await prisma.agent.findUnique({ where: { id: data.id } });
    if (existing?.passwordHash) {
      console.log(`  Exists: ${roleTag} (password unchanged)`);
      continue;
    }

    // Generated once and printed a single time. Only the hash is stored.
    const password = randomBytes(12).toString('base64url');
    const passwordHash = await hashPassword(password);

    await prisma.agent.upsert({
      where: { id: data.id },
      update: { email, passwordHash },
      create: {
        ...data,
        email,
        passwordHash,
        roleTag,
        authHash,
      },
    });
    newCredentials.push({ email, password });
    console.log(`  Created: ${roleTag}`);
  }

  console.log('\n--- Contacts ---');
  for (const data of CONTACTS) {
    await prisma.contact.upsert({
      where: { phone: data.phone },
      update: {},
      create: {
        ...data,
        assignedAgentIds: [],
        contextCard: {
          unifiedTimeline: [],
          activeCommitments: [],
          conflictFlags: [],
          contextSummary: '',
        },
      },
    });
    console.log(`  Created: ${data.name} (${data.organization})`);
  }

  console.log('\n--- Schedules ---');
  for (const data of SCHEDULES) {
    await prisma.schedule.create({
      data: {
        ...data,
        retryPolicy: { maxRetries: 3, backoffSeconds: 300 },
        createdBy: AGENTS[0].id,
        agentId: AGENTS[0].id,
        status: 'enabled',
      },
    });
    console.log(`  Created: ${data.name} [${data.cronExpression}]`);
  }

  if (newCredentials.length > 0) {
    console.log('\nLogin credentials (shown once, save them now):');
    for (const c of newCredentials) {
      console.log(`  ${c.email}  password: ${c.password}`);
    }
  }
  console.log('\nSeed complete.');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
