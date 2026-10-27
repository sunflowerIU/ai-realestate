CREATE TYPE "VisitStatus" AS ENUM ('PLANNED', 'COMPLETED', 'CANCELLED');

CREATE TABLE "Visit" (
    "id" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "requirementId" UUID,
    "visitedAt" TIMESTAMP(3) NOT NULL,
    "status" "VisitStatus" NOT NULL DEFAULT 'PLANNED',
    "feedback" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Visit_agentId_visitedAt_idx" ON "Visit"("agentId", "visitedAt");
CREATE INDEX "Visit_agentId_clientId_visitedAt_idx" ON "Visit"("agentId", "clientId", "visitedAt");
CREATE INDEX "Visit_agentId_propertyId_visitedAt_idx" ON "Visit"("agentId", "propertyId", "visitedAt");
CREATE INDEX "Visit_agentId_status_idx" ON "Visit"("agentId", "status");

ALTER TABLE "Visit" ADD CONSTRAINT "Visit_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_clientId_agentId_fkey" FOREIGN KEY ("clientId", "agentId") REFERENCES "Client"("id", "agentId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_propertyId_agentId_fkey" FOREIGN KEY ("propertyId", "agentId") REFERENCES "Property"("id", "agentId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_requirementId_agentId_fkey" FOREIGN KEY ("requirementId", "agentId") REFERENCES "BuyerRequirement"("id", "agentId") ON DELETE RESTRICT ON UPDATE CASCADE;
