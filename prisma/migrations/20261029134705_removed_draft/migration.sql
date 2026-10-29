/*
  Warnings:

  - The values [DRAFT] on the enum `PropertyStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PropertyStatus_new" AS ENUM ('ACTIVE', 'UNDER_NEGOTIATION', 'RESERVED', 'SOLD', 'RENTED', 'WITHDRAWN', 'ARCHIVED');
ALTER TABLE "public"."Property" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Property" ALTER COLUMN "status" TYPE "PropertyStatus_new" USING ("status"::text::"PropertyStatus_new");
ALTER TYPE "PropertyStatus" RENAME TO "PropertyStatus_old";
ALTER TYPE "PropertyStatus_new" RENAME TO "PropertyStatus";
DROP TYPE "public"."PropertyStatus_old";
ALTER TABLE "Property" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- AlterTable
ALTER TABLE "Property" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
