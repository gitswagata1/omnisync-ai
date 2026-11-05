-- AlterTable
ALTER TABLE "agents" ADD COLUMN     "email" VARCHAR(255),
ADD COLUMN     "passwordHash" VARCHAR(255);

-- CreateIndex
CREATE UNIQUE INDEX "agents_email_key" ON "agents"("email");

