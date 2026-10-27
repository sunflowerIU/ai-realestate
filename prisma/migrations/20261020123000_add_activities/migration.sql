CREATE TYPE "ActivityType" AS ENUM ('NOTE', 'CALL', 'MEETING', 'FOLLOW_UP', 'EMAIL', 'MESSAGE');
CREATE UNIQUE INDEX "Property_id_agentId_key" ON "Property"("id", "agentId");
CREATE UNIQUE INDEX "BuyerRequirement_id_agentId_key" ON "BuyerRequirement"("id", "agentId");

CREATE TABLE "Activity" (
    "id" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "clientId" UUID,
    "propertyId" UUID,
    "requirementId" UUID,
    "type" "ActivityType" NOT NULL,
    "notes" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "followUpAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Activity_agentId_occurredAt_idx" ON "Activity"("agentId", "occurredAt");
CREATE INDEX "Activity_agentId_followUpAt_idx" ON "Activity"("agentId", "followUpAt");
CREATE INDEX "Activity_agentId_clientId_idx" ON "Activity"("agentId", "clientId");
CREATE INDEX "Activity_agentId_propertyId_idx" ON "Activity"("agentId", "propertyId");
CREATE INDEX "Activity_agentId_requirementId_idx" ON "Activity"("agentId", "requirementId");

ALTER TABLE "Activity" ADD CONSTRAINT "Activity_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_clientId_agentId_fkey" FOREIGN KEY ("clientId", "agentId") REFERENCES "Client"("id", "agentId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_propertyId_agentId_fkey" FOREIGN KEY ("propertyId", "agentId") REFERENCES "Property"("id", "agentId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_requirementId_agentId_fkey" FOREIGN KEY ("requirementId", "agentId") REFERENCES "BuyerRequirement"("id", "agentId") ON DELETE RESTRICT ON UPDATE CASCADE;
