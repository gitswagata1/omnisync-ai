import { describe, it, expect, beforeAll } from 'vitest';
import {
  generateAuthHash,
  verifyAuthHash,
  buildRoleTag,
} from '../../src/services/agent-identity.js';

beforeAll(() => {
  process.env.SYSTEM_SECRET = 'test-secret-key-for-unit-tests-32ch';
});

describe('generateAuthHash', () => {
  it('produces consistent output for identical inputs', () => {
    const hash1 = generateAuthHash('agent-1', 'Purchase Manager', 'Purchase');
    const hash2 = generateAuthHash('agent-1', 'Purchase Manager', 'Purchase');
    expect(hash1).toBe(hash2);
  });

  it('produces different output for different agent IDs', () => {
    const hash1 = generateAuthHash('agent-1', 'Purchase Manager', 'Purchase');
    const hash2 = generateAuthHash('agent-2', 'Purchase Manager', 'Purchase');
    expect(hash1).not.toBe(hash2);
  });

  it('produces different output for different roles', () => {
    const hash1 = generateAuthHash('agent-1', 'Purchase Manager', 'Purchase');
    const hash2 = generateAuthHash('agent-1', 'Sales Lead', 'Purchase');
    expect(hash1).not.toBe(hash2);
  });

  it('produces different output for different departments', () => {
    const hash1 = generateAuthHash('agent-1', 'Manager', 'Purchase');
    const hash2 = generateAuthHash('agent-1', 'Manager', 'Sales');
    expect(hash1).not.toBe(hash2);
  });

  it('returns a 64-character hex string (SHA-256)', () => {
    const hash = generateAuthHash('agent-1', 'Role', 'Dept');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('verifyAuthHash', () => {
  it('returns true for a valid hash', () => {
    const hash = generateAuthHash('agent-1', 'Purchase Manager', 'Purchase');
    expect(verifyAuthHash('agent-1', 'Purchase Manager', 'Purchase', hash)).toBe(
      true
    );
  });

  it('returns false for a tampered hash', () => {
    const hash = generateAuthHash('agent-1', 'Purchase Manager', 'Purchase');
    const tampered = hash.replace(hash[0], hash[0] === 'a' ? 'b' : 'a');
    expect(
      verifyAuthHash('agent-1', 'Purchase Manager', 'Purchase', tampered)
    ).toBe(false);
  });

  it('returns false when agent ID is swapped', () => {
    const hash = generateAuthHash('agent-1', 'Purchase Manager', 'Purchase');
    expect(
      verifyAuthHash('agent-2', 'Purchase Manager', 'Purchase', hash)
    ).toBe(false);
  });

  it('returns false when role is changed', () => {
    const hash = generateAuthHash('agent-1', 'Purchase Manager', 'Purchase');
    expect(verifyAuthHash('agent-1', 'Sales Lead', 'Purchase', hash)).toBe(
      false
    );
  });
});

describe('buildRoleTag', () => {
  it('formats as Company | User | Department', () => {
    expect(buildRoleTag('Micro Turner', 'Swagata', 'Purchase')).toBe(
      'Micro Turner | Swagata | Purchase'
    );
  });

  it('handles different inputs', () => {
    expect(buildRoleTag('Acme Corp', 'John', 'Engineering')).toBe(
      'Acme Corp | John | Engineering'
    );
  });
});
