import { describe, it, expect } from 'vitest';
import {
  SchedulerState,
  SchedulerEvent,
  transition,
  retryBackoff,
  maxCompletionTime,
  InvalidTransitionError,
} from '../../src/services/scheduler-fsm.js';

describe('Scheduler FSM transitions', () => {
  describe('happy path: ENABLED → SUCCESS', () => {
    it('ENABLED + CRON_FIRE → RUNNING', () => {
      expect(transition(SchedulerState.ENABLED, SchedulerEvent.CRON_FIRE)).toBe(
        SchedulerState.RUNNING
      );
    });

    it('RUNNING + MSG_SENT → WAITING', () => {
      expect(transition(SchedulerState.RUNNING, SchedulerEvent.MSG_SENT)).toBe(
        SchedulerState.WAITING
      );
    });

    it('WAITING + LLM_ACCEPT → SUCCESS', () => {
      expect(
        transition(SchedulerState.WAITING, SchedulerEvent.LLM_ACCEPT)
      ).toBe(SchedulerState.SUCCESS);
    });

    it('SUCCESS + CRON_FIRE → RUNNING (next cycle)', () => {
      expect(
        transition(SchedulerState.SUCCESS, SchedulerEvent.CRON_FIRE)
      ).toBe(SchedulerState.RUNNING);
    });
  });

  describe('clarification loop', () => {
    it('WAITING + LLM_CLARIFY → WAITING (stays, follow-up sent)', () => {
      expect(
        transition(SchedulerState.WAITING, SchedulerEvent.LLM_CLARIFY)
      ).toBe(SchedulerState.WAITING);
    });
  });

  describe('failure and retry path', () => {
    it('RUNNING + MSG_FAILED → FAILED', () => {
      expect(
        transition(SchedulerState.RUNNING, SchedulerEvent.MSG_FAILED)
      ).toBe(SchedulerState.FAILED);
    });

    it('WAITING + LLM_REJECT → FAILED', () => {
      expect(
        transition(SchedulerState.WAITING, SchedulerEvent.LLM_REJECT)
      ).toBe(SchedulerState.FAILED);
    });

    it('FAILED + RETRY_AVAILABLE → RUNNING', () => {
      expect(
        transition(SchedulerState.FAILED, SchedulerEvent.RETRY_AVAILABLE)
      ).toBe(SchedulerState.RUNNING);
    });

    it('FAILED + RETRY_EXHAUST → ERROR', () => {
      expect(
        transition(SchedulerState.FAILED, SchedulerEvent.RETRY_EXHAUST)
      ).toBe(SchedulerState.ERROR);
    });

    it('ERROR + MANUAL_RESUME → ENABLED', () => {
      expect(
        transition(SchedulerState.ERROR, SchedulerEvent.MANUAL_RESUME)
      ).toBe(SchedulerState.ENABLED);
    });
  });

  describe('escalation path', () => {
    it('WAITING + TIMEOUT → ESCALATED', () => {
      expect(
        transition(SchedulerState.WAITING, SchedulerEvent.TIMEOUT)
      ).toBe(SchedulerState.ESCALATED);
    });

    it('ESCALATED + LLM_ACCEPT → SUCCESS (resolved)', () => {
      expect(
        transition(SchedulerState.ESCALATED, SchedulerEvent.LLM_ACCEPT)
      ).toBe(SchedulerState.SUCCESS);
    });

    it('ESCALATED + TIMEOUT → ERROR (double escalation)', () => {
      expect(
        transition(SchedulerState.ESCALATED, SchedulerEvent.TIMEOUT)
      ).toBe(SchedulerState.ERROR);
    });
  });

  describe('pause/resume', () => {
    it('ENABLED + MANUAL_PAUSE → PAUSED', () => {
      expect(
        transition(SchedulerState.ENABLED, SchedulerEvent.MANUAL_PAUSE)
      ).toBe(SchedulerState.PAUSED);
    });

    it('PAUSED + MANUAL_RESUME → ENABLED', () => {
      expect(
        transition(SchedulerState.PAUSED, SchedulerEvent.MANUAL_RESUME)
      ).toBe(SchedulerState.ENABLED);
    });
  });

  describe('delete from any non-terminal state', () => {
    const deletableStates = [
      SchedulerState.ENABLED,
      SchedulerState.RUNNING,
      SchedulerState.WAITING,
      SchedulerState.SUCCESS,
      SchedulerState.FAILED,
      SchedulerState.ERROR,
      SchedulerState.ESCALATED,
      SchedulerState.PAUSED,
    ];

    for (const state of deletableStates) {
      it(`${state} + MANUAL_DELETE → DELETED`, () => {
        expect(transition(state, SchedulerEvent.MANUAL_DELETE)).toBe(
          SchedulerState.DELETED
        );
      });
    }
  });

  describe('DELETED is terminal (absorbing state)', () => {
    const allEvents = Object.values(SchedulerEvent);

    for (const event of allEvents) {
      it(`DELETED + ${event} → throws InvalidTransitionError`, () => {
        expect(() =>
          transition(SchedulerState.DELETED, event)
        ).toThrow(InvalidTransitionError);
      });
    }
  });

  describe('invalid transitions throw', () => {
    it('ENABLED + LLM_ACCEPT is invalid', () => {
      expect(() =>
        transition(SchedulerState.ENABLED, SchedulerEvent.LLM_ACCEPT)
      ).toThrow(InvalidTransitionError);
    });

    it('RUNNING + TIMEOUT is invalid (must be WAITING first)', () => {
      expect(() =>
        transition(SchedulerState.RUNNING, SchedulerEvent.TIMEOUT)
      ).toThrow(InvalidTransitionError);
    });

    it('PAUSED + CRON_FIRE is invalid (must resume first)', () => {
      expect(() =>
        transition(SchedulerState.PAUSED, SchedulerEvent.CRON_FIRE)
      ).toThrow(InvalidTransitionError);
    });

    it('ERROR + CRON_FIRE is invalid (must resume first)', () => {
      expect(() =>
        transition(SchedulerState.ERROR, SchedulerEvent.CRON_FIRE)
      ).toThrow(InvalidTransitionError);
    });
  });

  describe('bounded liveness: all active paths reach a resting state', () => {
    it('happy path reaches SUCCESS within defined transitions', () => {
      let state = SchedulerState.ENABLED;
      state = transition(state, SchedulerEvent.CRON_FIRE);
      state = transition(state, SchedulerEvent.MSG_SENT);
      state = transition(state, SchedulerEvent.LLM_ACCEPT);
      expect(state).toBe(SchedulerState.SUCCESS);
    });

    it('failure-exhaust path reaches ERROR', () => {
      let state = SchedulerState.ENABLED;
      state = transition(state, SchedulerEvent.CRON_FIRE);
      state = transition(state, SchedulerEvent.MSG_FAILED);
      state = transition(state, SchedulerEvent.RETRY_EXHAUST);
      expect(state).toBe(SchedulerState.ERROR);
    });

    it('escalation-timeout path reaches ERROR', () => {
      let state = SchedulerState.ENABLED;
      state = transition(state, SchedulerEvent.CRON_FIRE);
      state = transition(state, SchedulerEvent.MSG_SENT);
      state = transition(state, SchedulerEvent.TIMEOUT);
      state = transition(state, SchedulerEvent.TIMEOUT);
      expect(state).toBe(SchedulerState.ERROR);
    });

    it('full retry cycle: fail → retry → fail → exhaust → error', () => {
      let state = SchedulerState.ENABLED;
      state = transition(state, SchedulerEvent.CRON_FIRE);
      state = transition(state, SchedulerEvent.MSG_FAILED);
      // Retry attempt 1
      state = transition(state, SchedulerEvent.RETRY_AVAILABLE);
      expect(state).toBe(SchedulerState.RUNNING);
      state = transition(state, SchedulerEvent.MSG_FAILED);
      // Retry attempt 2
      state = transition(state, SchedulerEvent.RETRY_AVAILABLE);
      state = transition(state, SchedulerEvent.MSG_FAILED);
      // Exhausted
      state = transition(state, SchedulerEvent.RETRY_EXHAUST);
      expect(state).toBe(SchedulerState.ERROR);
    });
  });
});

describe('retryBackoff', () => {
  it('returns baseSeconds for attempt 0', () => {
    expect(retryBackoff(0, 300)).toBe(300);
  });

  it('doubles for attempt 1', () => {
    expect(retryBackoff(1, 300)).toBe(600);
  });

  it('quadruples for attempt 2', () => {
    expect(retryBackoff(2, 300)).toBe(1200);
  });

  it('scales with different base', () => {
    expect(retryBackoff(3, 100)).toBe(800);
  });
});

describe('maxCompletionTime', () => {
  it('computes T_max = T_wait * (1 + maxRetries) + T_escalation', () => {
    expect(maxCompletionTime(7200, 3, 3600)).toBe(7200 * 4 + 3600);
  });

  it('with zero retries: T_max = T_wait + T_escalation', () => {
    expect(maxCompletionTime(7200, 0, 3600)).toBe(7200 + 3600);
  });
});
