CREATE TYPE "RequirementStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CLOSED');

CREATE TABLE "BuyerRequirement" (
    "id" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "title" TEXT,
    "transactionType" "TransactionType" NOT NULL,
    "propertyType" "PropertyType" NOT NULL,
    "preferredLocations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "minBudgetNpr" BIGINT,
    "maxBudgetNpr" BIGINT,
    "minLandAreaSqMm" BIGINT,
    "maxLandAreaSqMm" BIGINT,
    "minBedrooms" INTEGER,
    "minRoadAccessMeters" DECIMAL(8,2),
    "notes" TEXT,
    "status" "RequirementStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BuyerRequirement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BuyerRequirement_agentId_clientId_idx" ON "BuyerRequirement"("agentId", "clientId");
CREATE INDEX "BuyerRequirement_agentId_status_createdAt_idx" ON "BuyerRequirement"("agentId", "status", "createdAt");
CREATE INDEX "BuyerRequirement_agentId_propertyType_transactionType_idx" ON "BuyerRequirement"("agentId", "propertyType", "transactionType");
CREATE INDEX "BuyerRequirement_agentId_maxBudgetNpr_idx" ON "BuyerRequirement"("agentId", "maxBudgetNpr");

ALTER TABLE "BuyerRequirement" ADD CONSTRAINT "BuyerRequirement_agentId_fkey"
    FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BuyerRequirement" ADD CONSTRAINT "BuyerRequirement_clientId_agentId_fkey"
    FOREIGN KEY ("clientId", "agentId") REFERENCES "Client"("id", "agentId") ON DELETE RESTRICT ON UPDATE CASCADE;
