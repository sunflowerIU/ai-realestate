CREATE TYPE "PropertyType" AS ENUM ('HOUSE', 'APARTMENT', 'LAND', 'COMMERCIAL', 'OTHER');
CREATE TYPE "TransactionType" AS ENUM ('SALE', 'RENT');
CREATE TYPE "PropertyStatus" AS ENUM ('DRAFT', 'ACTIVE', 'UNDER_NEGOTIATION', 'RESERVED', 'SOLD', 'RENTED', 'WITHDRAWN', 'ARCHIVED');
CREATE TYPE "LandAreaUnit" AS ENUM ('ROPANI', 'AANA', 'PAISA', 'DAAM', 'BIGHA', 'KATTHA', 'DHUR', 'SQ_FT', 'SQ_M');

CREATE UNIQUE INDEX "Client_id_agentId_key" ON "Client"("id", "agentId");

CREATE TABLE "Property" (
    "id" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "ownerClientId" UUID,
    "code" TEXT,
    "title" TEXT NOT NULL,
    "propertyType" "PropertyType" NOT NULL,
    "transactionType" "TransactionType" NOT NULL,
    "status" "PropertyStatus" NOT NULL DEFAULT 'DRAFT',
    "province" TEXT,
    "district" TEXT,
    "municipality" TEXT,
    "locality" TEXT,
    "priceNpr" BIGINT,
    "landAreaSqMm" BIGINT,
    "landAreaValue" TEXT,
    "landAreaUnit" "LandAreaUnit",
    "builtUpAreaSqMm" BIGINT,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "roadAccessMeters" DECIMAL(8,2),
    "facing" TEXT,
    "description" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Property_agentId_code_key" ON "Property"("agentId", "code");
CREATE INDEX "Property_agentId_status_createdAt_idx" ON "Property"("agentId", "status", "createdAt");
CREATE INDEX "Property_agentId_propertyType_transactionType_idx" ON "Property"("agentId", "propertyType", "transactionType");
CREATE INDEX "Property_agentId_priceNpr_idx" ON "Property"("agentId", "priceNpr");
CREATE INDEX "Property_agentId_district_municipality_idx" ON "Property"("agentId", "district", "municipality");
CREATE INDEX "Property_agentId_ownerClientId_idx" ON "Property"("agentId", "ownerClientId");

ALTER TABLE "Property" ADD CONSTRAINT "Property_agentId_fkey"
    FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Property" ADD CONSTRAINT "Property_ownerClientId_agentId_fkey"
    FOREIGN KEY ("ownerClientId", "agentId") REFERENCES "Client"("id", "agentId") ON DELETE RESTRICT ON UPDATE CASCADE;
