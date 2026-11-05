import OpenAI from 'openai';
import { z } from 'zod';
import { config } from '../config/index.js';
import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';

const openai = new OpenAI({ apiKey: config.llm.apiKey });

const EvaluationSchema = z.object({
  completeness: z.number().min(0).max(1),
  compliance: z.number().min(0).max(1),
  entities: z.array(z.object({ type: z.string(), value: z.string() })),
  decision: z.enum(['ACCEPT', 'CLARIFY', 'REJECT']),
  followUp: z.string().nullable(),
});

export type LLMEvaluation = z.infer<typeof EvaluationSchema>;

const THRESHOLDS = {
  completeness: 0.6,
  compliance: 0.7,
  reject: 0.4,
};

export async function evaluateResponse(
  originalMessage: string,
  response: string,
  taskType: string,
  expectedCriteria: string
): Promise<LLMEvaluation> {
  logger.info('Evaluating response via LLM');

  const completion = await openai.chat.completions.create({
    model: config.llm.evalModel,
    temperature: config.llm.evalTemperature,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You are an enterprise communication evaluator. Analyze the response to a scheduled operational message and return a structured JSON evaluation. Return ONLY valid JSON matching this schema: { "completeness": number(0-1), "compliance": number(0-1), "entities": [{"type": string, "value": string}], "decision": "ACCEPT"|"CLARIFY"|"REJECT", "followUp": string|null }',
      },
      {
        role: 'user',
        content: `TASK TYPE: ${taskType}\nORIGINAL MESSAGE: "${originalMessage}"\nEXPECTED: ${expectedCriteria}\nRESPONSE: "${response}"\n\nEvaluate the response. Set decision based on: ACCEPT if completeness >= ${THRESHOLDS.completeness} AND compliance >= ${THRESHOLDS.compliance}. CLARIFY if completeness < ${THRESHOLDS.completeness} but compliance >= ${THRESHOLDS.reject}. REJECT if compliance < ${THRESHOLDS.reject}. If CLARIFY or REJECT, generate a concise follow-up message.`,
      },
    ],
  });

  const raw = JSON.parse(completion.choices[0].message.content ?? '{}');
  const evaluation = EvaluationSchema.parse(raw);

  logger.info(
    `LLM evaluation: decision=${evaluation.decision}, completeness=${evaluation.completeness}, compliance=${evaluation.compliance}`
  );

  return evaluation;
}

export async function analyzeInboundMessage(
  messageBody: string,
  senderName: string,
  senderOrg: string
): Promise<{
  intent: string;
  urgency: number;
  entities: Array<{ type: string; value: string }>;
  suggestedReplies: string[];
}> {
  const completion = await openai.chat.completions.create({
    model: config.llm.evalModel,
    temperature: config.llm.evalTemperature,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You are an enterprise message analyzer for a manufacturing company. Analyze inbound messages and return JSON: { "intent": string, "urgency": number(1-5), "entities": [{"type": string, "value": string}], "suggestedReplies": [string, string] }',
      },
      {
        role: 'user',
        content: `From: ${senderName} (${senderOrg})\nMessage: "${messageBody}"\n\nClassify intent, rate urgency 1-5, extract entities (PO numbers, dates, amounts, part numbers), and suggest 2 contextual reply options.`,
      },
    ],
  });

  return JSON.parse(completion.choices[0].message.content ?? '{}');
}

export async function generateDigest(
  timeRange: { start: Date; end: Date },
  recipientRole: string
): Promise<string> {
  logger.info(
    `Generating ${recipientRole} digest for ${timeRange.start.toISOString()} to ${timeRange.end.toISOString()}`
  );

  const [messages, scheduleLogs, escalations] = await Promise.all([
    prisma.message.findMany({
      where: {
        createdAt: { gte: timeRange.start, lte: timeRange.end },
      },
      include: { conversation: { include: { contact: true } }, senderAgent: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.scheduleLog.findMany({
      where: {
        executedAt: { gte: timeRange.start, lte: timeRange.end },
      },
      include: { schedule: true },
    }),
    prisma.escalation.findMany({
      where: {
        createdAt: { gte: timeRange.start, lte: timeRange.end },
      },
    }),
  ]);

  const metrics = {
    totalMessages: messages.length,
    inbound: messages.filter((m) => m.direction === 'inbound').length,
    outbound: messages.filter((m) => m.direction === 'outbound').length,
    scheduledExecutions: scheduleLogs.length,
    successful: scheduleLogs.filter((l) => l.status === 'success').length,
    failed: scheduleLogs.filter((l) => l.status === 'failed').length,
    escalated: escalations.length,
    unresolvedEscalations: escalations.filter((e) => !e.resolvedAt).length,
  };

  const keyEvents = messages
    .filter((m) => {
      const analysis = m.llmAnalysis as Record<string, unknown> | null;
      return analysis && (analysis.urgency as number) >= 3;
    })
    .slice(0, 10)
    .map((m) => ({
      from: m.direction === 'inbound'
        ? m.conversation?.contact?.name ?? m.senderPhone
        : m.senderAgent?.roleTag ?? 'System',
      body: (m.body ?? '').slice(0, 100),
      direction: m.direction,
    }));

  const completion = await openai.chat.completions.create({
    model: config.llm.evalModel,
    temperature: config.llm.digestTemperature,
    messages: [
      {
        role: 'system',
        content: `You are an executive operations report writer for a manufacturing company. Generate a concise WhatsApp-readable operations summary. Use bullet points and line breaks. No markdown tables. Lead with items needing attention. Under 500 words.`,
      },
      {
        role: 'user',
        content: `Generate a ${recipientRole} operations report.\n\nPERIOD: ${timeRange.start.toLocaleDateString()} to ${timeRange.end.toLocaleDateString()}\n\nMETRICS: ${JSON.stringify(metrics)}\n\nKEY EVENTS: ${JSON.stringify(keyEvents)}\n\nESCALATIONS: ${escalations.length} total, ${metrics.unresolvedEscalations} unresolved`,
      },
    ],
  });

  return completion.choices[0].message.content ?? 'No digest generated.';
}
