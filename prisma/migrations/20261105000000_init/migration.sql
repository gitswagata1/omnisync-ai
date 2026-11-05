-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "agents" (
    "id" UUID NOT NULL,
    "company" VARCHAR(100) NOT NULL DEFAULT 'Micro Turner',
    "userName" VARCHAR(100) NOT NULL,
    "role" VARCHAR(100) NOT NULL,
    "department" VARCHAR(100) NOT NULL,
    "personalPhone" VARCHAR(20),
    "roleTag" VARCHAR(255) NOT NULL,
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "authHash" VARCHAR(64) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" UUID NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "name" VARCHAR(200),
    "organization" VARCHAR(200),
    "contactType" VARCHAR(50),
    "departments" TEXT[],
    "assignedAgentIds" UUID[],
    "contextCard" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL,
    "contactId" UUID NOT NULL,
    "department" VARCHAR(100),
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "lastMessageAt" TIMESTAMP(3),
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "waMessageId" VARCHAR(100),
    "direction" VARCHAR(10) NOT NULL,
    "senderAgentId" UUID,
    "senderPhone" VARCHAR(20),
    "messageType" VARCHAR(20),
    "body" TEXT,
    "mediaUrl" VARCHAR(500),
    "transcript" TEXT,
    "llmAnalysis" JSONB,
    "deliveryStatus" VARCHAR(20),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedules" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "scheduleType" VARCHAR(50),
    "cronExpression" VARCHAR(100) NOT NULL,
    "recipientPhone" VARCHAR(20) NOT NULL,
    "recipientName" VARCHAR(200),
    "agentId" UUID,
    "messageTemplate" VARCHAR(100),
    "templateVars" JSONB NOT NULL DEFAULT '{}',
    "expectedCriteria" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'enabled',
    "retryPolicy" JSONB NOT NULL DEFAULT '{"maxRetries": 3, "backoffSeconds": 300}',
    "escalationConfig" JSONB,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "runCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_logs" (
    "id" UUID NOT NULL,
    "scheduleId" UUID NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(20) NOT NULL,
    "waMessageId" VARCHAR(100),
    "errorMessage" TEXT,
    "responseReceived" BOOLEAN NOT NULL DEFAULT false,
    "responseAt" TIMESTAMP(3),
    "llmEvaluation" JSONB,

    CONSTRAINT "schedule_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escalations" (
    "id" UUID NOT NULL,
    "triggerType" VARCHAR(50) NOT NULL,
    "sourceId" UUID,
    "escalatedTo" VARCHAR(20) NOT NULL,
    "escalationMsg" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'sent',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "escalations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL,
    "actorAgentId" UUID,
    "action" VARCHAR(100) NOT NULL,
    "targetType" VARCHAR(50),
    "targetId" UUID,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contacts_phone_key" ON "contacts"("phone");

-- CreateIndex
CREATE INDEX "messages_conversationId_idx" ON "messages"("conversationId");

-- CreateIndex
CREATE INDEX "messages_createdAt_idx" ON "messages"("createdAt");

-- CreateIndex
CREATE INDEX "messages_waMessageId_idx" ON "messages"("waMessageId");

-- CreateIndex
CREATE INDEX "schedules_status_idx" ON "schedules"("status");

-- CreateIndex
CREATE INDEX "schedules_nextRunAt_idx" ON "schedules"("nextRunAt");

-- CreateIndex
CREATE INDEX "schedule_logs_scheduleId_idx" ON "schedule_logs"("scheduleId");

-- CreateIndex
CREATE INDEX "audit_log_createdAt_idx" ON "audit_log"("createdAt");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderAgentId_fkey" FOREIGN KEY ("senderAgentId") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_logs" ADD CONSTRAINT "schedule_logs_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

