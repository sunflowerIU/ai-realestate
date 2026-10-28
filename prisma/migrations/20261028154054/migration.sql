/*
  Warnings:

  - You are about to drop the column `preferredLocations` on the `BuyerRequirement` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BuyerRequirement" DROP COLUMN "preferredLocations";

-- CreateTable
CREATE TABLE "RequirementPreferredLocation" (
    "id" UUID NOT NULL,
    "requirementId" UUID NOT NULL,
    "province" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "municipality" TEXT NOT NULL,
    "localities" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "RequirementPreferredLocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RequirementPreferredLocation_requirementId_idx" ON "RequirementPreferredLocation"("requirementId");

-- AddForeignKey
ALTER TABLE "RequirementPreferredLocation" ADD CONSTRAINT "RequirementPreferredLocation_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "BuyerRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
