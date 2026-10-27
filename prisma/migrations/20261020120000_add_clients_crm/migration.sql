CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TABLE "Client" (
    "id" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "alternatePhone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "source" TEXT,
    "status" "ClientStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Client_agentId_idx" ON "Client"("agentId");
CREATE INDEX "Client_agentId_status_createdAt_idx" ON "Client"("agentId", "status", "createdAt");
CREATE INDEX "Client_agentId_createdAt_idx" ON "Client"("agentId", "createdAt");

ALTER TABLE "Client" ADD CONSTRAINT "Client_agentId_fkey"
    FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
