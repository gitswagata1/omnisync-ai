export enum SchedulerState {
  ENABLED = 'ENABLED',
  RUNNING = 'RUNNING',
  WAITING = 'WAITING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  ERROR = 'ERROR',
  ESCALATED = 'ESCALATED',
  PAUSED = 'PAUSED',
  DELETED = 'DELETED',
}

export enum SchedulerEvent {
  CRON_FIRE = 'CRON_FIRE',
  MSG_SENT = 'MSG_SENT',
  MSG_FAILED = 'MSG_FAILED',
  TIMEOUT = 'TIMEOUT',
  RETRY_AVAILABLE = 'RETRY_AVAILABLE',
  RETRY_EXHAUST = 'RETRY_EXHAUST',
  LLM_ACCEPT = 'LLM_ACCEPT',
  LLM_CLARIFY = 'LLM_CLARIFY',
  LLM_REJECT = 'LLM_REJECT',
  MANUAL_PAUSE = 'MANUAL_PAUSE',
  MANUAL_RESUME = 'MANUAL_RESUME',
  MANUAL_DELETE = 'MANUAL_DELETE',
}

type TransitionKey = `${SchedulerState}:${SchedulerEvent}`;

const TRANSITIONS: Record<TransitionKey, SchedulerState> = {
  [`${SchedulerState.ENABLED}:${SchedulerEvent.CRON_FIRE}`]: SchedulerState.RUNNING,
  [`${SchedulerState.ENABLED}:${SchedulerEvent.MANUAL_PAUSE}`]: SchedulerState.PAUSED,
  [`${SchedulerState.ENABLED}:${SchedulerEvent.MANUAL_DELETE}`]: SchedulerState.DELETED,

  [`${SchedulerState.RUNNING}:${SchedulerEvent.MSG_SENT}`]: SchedulerState.WAITING,
  [`${SchedulerState.RUNNING}:${SchedulerEvent.MSG_FAILED}`]: SchedulerState.FAILED,
  [`${SchedulerState.RUNNING}:${SchedulerEvent.MANUAL_DELETE}`]: SchedulerState.DELETED,

  [`${SchedulerState.WAITING}:${SchedulerEvent.LLM_ACCEPT}`]: SchedulerState.SUCCESS,
  [`${SchedulerState.WAITING}:${SchedulerEvent.LLM_CLARIFY}`]: SchedulerState.WAITING,
  [`${SchedulerState.WAITING}:${SchedulerEvent.LLM_REJECT}`]: SchedulerState.FAILED,
  [`${SchedulerState.WAITING}:${SchedulerEvent.TIMEOUT}`]: SchedulerState.ESCALATED,
  [`${SchedulerState.WAITING}:${SchedulerEvent.MANUAL_DELETE}`]: SchedulerState.DELETED,

  [`${SchedulerState.SUCCESS}:${SchedulerEvent.CRON_FIRE}`]: SchedulerState.RUNNING,
  [`${SchedulerState.SUCCESS}:${SchedulerEvent.MANUAL_DELETE}`]: SchedulerState.DELETED,

  [`${SchedulerState.FAILED}:${SchedulerEvent.RETRY_AVAILABLE}`]: SchedulerState.RUNNING,
  [`${SchedulerState.FAILED}:${SchedulerEvent.RETRY_EXHAUST}`]: SchedulerState.ERROR,
  [`${SchedulerState.FAILED}:${SchedulerEvent.MANUAL_DELETE}`]: SchedulerState.DELETED,

  [`${SchedulerState.ERROR}:${SchedulerEvent.MANUAL_RESUME}`]: SchedulerState.ENABLED,
  [`${SchedulerState.ERROR}:${SchedulerEvent.MANUAL_DELETE}`]: SchedulerState.DELETED,

  [`${SchedulerState.ESCALATED}:${SchedulerEvent.LLM_ACCEPT}`]: SchedulerState.SUCCESS,
  [`${SchedulerState.ESCALATED}:${SchedulerEvent.TIMEOUT}`]: SchedulerState.ERROR,
  [`${SchedulerState.ESCALATED}:${SchedulerEvent.MANUAL_DELETE}`]: SchedulerState.DELETED,

  [`${SchedulerState.PAUSED}:${SchedulerEvent.MANUAL_RESUME}`]: SchedulerState.ENABLED,
  [`${SchedulerState.PAUSED}:${SchedulerEvent.MANUAL_DELETE}`]: SchedulerState.DELETED,
} as Record<TransitionKey, SchedulerState>;

export class InvalidTransitionError extends Error {
  constructor(
    public readonly state: SchedulerState,
    public readonly event: SchedulerEvent
  ) {
    super(`Invalid transition: ${state} + ${event}`);
    this.name = 'InvalidTransitionError';
  }
}

export function transition(
  state: SchedulerState,
  event: SchedulerEvent
): SchedulerState {
  if (state === SchedulerState.DELETED) {
    throw new InvalidTransitionError(state, event);
  }

  const key = `${state}:${event}` as TransitionKey;
  const next = TRANSITIONS[key];

  if (next === undefined) {
    throw new InvalidTransitionError(state, event);
  }

  return next;
}

export function retryBackoff(attempt: number, baseSeconds: number): number {
  return Math.pow(2, attempt) * baseSeconds;
}

export function maxCompletionTime(
  waitTimeout: number,
  maxRetries: number,
  escalationTimeout: number
): number {
  return waitTimeout * (1 + maxRetries) + escalationTimeout;
}
