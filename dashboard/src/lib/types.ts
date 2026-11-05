export interface Agent {
  id: string;
  company: string;
  userName: string;
  role: string;
  department: string;
  roleTag: string;
  permissions: string[];
  status: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  phone: string;
  name: string;
  company: string;
  departments: string[];
  contextVector: Record<string, unknown>;
  status: string;
  createdAt: string;
}

export interface Schedule {
  id: string;
  name: string;
  scheduleType: string;
  cronExpression: string;
  recipientPhone: string;
  messageTemplate: string | null;
  templateVars: Record<string, string>;
  expectedCriteria: string | null;
  status: string;
  runCount: number;
  errorCount: number;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  direction: 'inbound' | 'outbound';
  contentType: string;
  body: string;
  senderPhone: string;
  roleTag: string | null;
  waMessageId: string | null;
  llmAnalysis: Record<string, unknown> | null;
  createdAt: string;
}

export interface DashboardMetrics {
  messagesToday: number;
  activeSchedules: number;
  pendingEscalations: number;
  avgResponseTime: number;
  messagesThisWeek: number;
  schedulesRunToday: number;
}

export interface Escalation {
  id: string;
  scheduleId: string;
  reason: string;
  status: string;
  createdAt: string;
}
