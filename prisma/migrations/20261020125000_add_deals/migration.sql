CREATE TYPE "DealStatus" AS ENUM ('OPEN', 'NEGOTIATING', 'WON', 'LOST', 'CANCELLED');

CREATE TABLE "Deal" (
    "id" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "requirementId" UUID,
    "status" "DealStatus" NOT NULL DEFAULT 'OPEN',
    "agreedPriceNpr" BIGINT,
    "commissionNpr" BIGINT,
    "notes" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Deal_agentId_status_createdAt_idx" ON "Deal"("agentId", "status", "createdAt");
CREATE INDEX "Deal_agentId_clientId_idx" ON "Deal"("agentId", "clientId");
CREATE INDEX "Deal_agentId_propertyId_idx" ON "Deal"("agentId", "propertyId");
CREATE INDEX "Deal_agentId_createdAt_idx" ON "Deal"("agentId", "createdAt");

ALTER TABLE "Deal" ADD CONSTRAINT "Deal_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_clientId_agentId_fkey" FOREIGN KEY ("clientId", "agentId") REFERENCES "Client"("id", "agentId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_propertyId_agentId_fkey" FOREIGN KEY ("propertyId", "agentId") REFERENCES "Property"("id", "agentId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_requirementId_agentId_fkey" FOREIGN KEY ("requirementId", "agentId") REFERENCES "BuyerRequirement"("id", "agentId") ON DELETE RESTRICT ON UPDATE CASCADE;
