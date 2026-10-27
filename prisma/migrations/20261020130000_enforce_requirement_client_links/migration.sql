CREATE UNIQUE INDEX "BuyerRequirement_id_agentId_clientId_key" ON "BuyerRequirement"("id", "agentId", "clientId");

ALTER TABLE "Visit" DROP CONSTRAINT "Visit_requirementId_agentId_fkey";
ALTER TABLE "Deal" DROP CONSTRAINT "Deal_requirementId_agentId_fkey";

ALTER TABLE "Visit" ADD CONSTRAINT "Visit_requirementId_agentId_clientId_fkey"
    FOREIGN KEY ("requirementId", "agentId", "clientId") REFERENCES "BuyerRequirement"("id", "agentId", "clientId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_requirementId_agentId_clientId_fkey"
    FOREIGN KEY ("requirementId", "agentId", "clientId") REFERENCES "BuyerRequirement"("id", "agentId", "clientId") ON DELETE RESTRICT ON UPDATE CASCADE;
