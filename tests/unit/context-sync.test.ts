import { describe, it, expect } from 'vitest';

interface Agent {
  id: string;
  department: string;
  permissions: string[];
}

interface Contact {
  id: string;
  departmentBindings: string[];
  activeCommitments: Commitment[];
}

interface Commitment {
  type: string;
  value: string;
  department: string;
  agentId: string;
}

interface SyncEvent {
  type: string;
  contactId: string;
  sourceDepartment: string;
  payload: Record<string, unknown>;
}

function computePropagationTargets(
  event: SyncEvent,
  contact: Contact,
  agents: Agent[]
): Agent[] {
  const targetDepartments = contact.departmentBindings.filter(
    (d) => d !== event.sourceDepartment
  );

  return agents.filter(
    (a) =>
      targetDepartments.includes(a.department) &&
      a.permissions.includes(`view_contact:${contact.id}`)
  );
}

function computeEscalationTargets(
  event: SyncEvent,
  contact: Contact,
  agents: Agent[],
  supervisors: Agent[]
): Agent[] {
  const baseTargets = computePropagationTargets(event, contact, agents);
  return [...baseTargets, ...supervisors];
}

function detectCommitmentConflict(
  event: SyncEvent,
  contact: Contact
): Commitment[] {
  if (event.type !== 'E_COMMITMENT') return [];

  const newType = event.payload.commitmentType as string;
  const newValue = event.payload.value as string;

  return contact.activeCommitments.filter(
    (k) =>
      k.type === newType &&
      k.value !== newValue &&
      k.department !== event.sourceDepartment
  );
}

// --- Tests ---

const testContact: Contact = {
  id: 'mercedes-001',
  departmentBindings: ['Purchase', 'Sales', 'Quality'],
  activeCommitments: [
    {
      type: 'delivery_date',
      value: 'Week 47',
      department: 'Purchase',
      agentId: 'swagata',
    },
  ],
};

const testAgents: Agent[] = [
  {
    id: 'swagata',
    department: 'Purchase',
    permissions: ['view_contact:mercedes-001'],
  },
  {
    id: 'amit',
    department: 'Sales',
    permissions: ['view_contact:mercedes-001'],
  },
  {
    id: 'priya',
    department: 'Quality',
    permissions: ['view_contact:mercedes-001'],
  },
  {
    id: 'rahul',
    department: 'Logistics',
    permissions: ['view_contact:mercedes-001'],
  },
  {
    id: 'deepak',
    department: 'Sales',
    permissions: [],
  },
];

describe('computePropagationTargets', () => {
  it('excludes the source department from targets', () => {
    const event: SyncEvent = {
      type: 'E_OUTBOUND',
      contactId: 'mercedes-001',
      sourceDepartment: 'Purchase',
      payload: {},
    };

    const targets = computePropagationTargets(event, testContact, testAgents);
    const departments = targets.map((a) => a.department);

    expect(departments).not.toContain('Purchase');
  });

  it('includes agents from all other bound departments with permission', () => {
    const event: SyncEvent = {
      type: 'E_OUTBOUND',
      contactId: 'mercedes-001',
      sourceDepartment: 'Purchase',
      payload: {},
    };

    const targets = computePropagationTargets(event, testContact, testAgents);
    const ids = targets.map((a) => a.id);

    expect(ids).toContain('amit');
    expect(ids).toContain('priya');
  });

  it('excludes agents from departments not bound to the contact', () => {
    const event: SyncEvent = {
      type: 'E_OUTBOUND',
      contactId: 'mercedes-001',
      sourceDepartment: 'Purchase',
      payload: {},
    };

    const targets = computePropagationTargets(event, testContact, testAgents);
    const ids = targets.map((a) => a.id);

    expect(ids).not.toContain('rahul');
  });

  it('excludes agents without view_contact permission', () => {
    const event: SyncEvent = {
      type: 'E_OUTBOUND',
      contactId: 'mercedes-001',
      sourceDepartment: 'Purchase',
      payload: {},
    };

    const targets = computePropagationTargets(event, testContact, testAgents);
    const ids = targets.map((a) => a.id);

    expect(ids).not.toContain('deepak');
  });

  it('returns empty when source is the only bound department', () => {
    const singleDeptContact: Contact = {
      id: 'local-vendor',
      departmentBindings: ['Purchase'],
      activeCommitments: [],
    };

    const event: SyncEvent = {
      type: 'E_OUTBOUND',
      contactId: 'local-vendor',
      sourceDepartment: 'Purchase',
      payload: {},
    };

    const targets = computePropagationTargets(
      event,
      singleDeptContact,
      testAgents
    );
    expect(targets).toHaveLength(0);
  });
});

describe('computeEscalationTargets', () => {
  it('includes supervisors in addition to base propagation targets', () => {
    const supervisors: Agent[] = [
      {
        id: 'vp-ops',
        department: 'Management',
        permissions: ['view_contact:mercedes-001'],
      },
    ];

    const event: SyncEvent = {
      type: 'E_ESCALATION',
      contactId: 'mercedes-001',
      sourceDepartment: 'Purchase',
      payload: {},
    };

    const targets = computeEscalationTargets(
      event,
      testContact,
      testAgents,
      supervisors
    );
    const ids = targets.map((a) => a.id);

    expect(ids).toContain('vp-ops');
    expect(ids).toContain('amit');
    expect(ids).toContain('priya');
  });
});

describe('detectCommitmentConflict', () => {
  it('detects conflict when another department committed a different value', () => {
    const event: SyncEvent = {
      type: 'E_COMMITMENT',
      contactId: 'mercedes-001',
      sourceDepartment: 'Sales',
      payload: {
        commitmentType: 'delivery_date',
        value: 'Week 48',
      },
    };

    const conflicts = detectCommitmentConflict(event, testContact);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].department).toBe('Purchase');
    expect(conflicts[0].value).toBe('Week 47');
  });

  it('returns empty when commitment matches existing value', () => {
    const event: SyncEvent = {
      type: 'E_COMMITMENT',
      contactId: 'mercedes-001',
      sourceDepartment: 'Sales',
      payload: {
        commitmentType: 'delivery_date',
        value: 'Week 47',
      },
    };

    const conflicts = detectCommitmentConflict(event, testContact);
    expect(conflicts).toHaveLength(0);
  });

  it('returns empty for non-commitment events', () => {
    const event: SyncEvent = {
      type: 'E_OUTBOUND',
      contactId: 'mercedes-001',
      sourceDepartment: 'Sales',
      payload: {},
    };

    const conflicts = detectCommitmentConflict(event, testContact);
    expect(conflicts).toHaveLength(0);
  });

  it('ignores conflicts from the same department', () => {
    const event: SyncEvent = {
      type: 'E_COMMITMENT',
      contactId: 'mercedes-001',
      sourceDepartment: 'Purchase',
      payload: {
        commitmentType: 'delivery_date',
        value: 'Week 48',
      },
    };

    const conflicts = detectCommitmentConflict(event, testContact);
    expect(conflicts).toHaveLength(0);
  });
});
