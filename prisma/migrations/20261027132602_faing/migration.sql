/*
  Warnings:

  - The `facing` column on the `Property` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Facing" AS ENUM ('NORTH', 'NORTH_EAST', 'EAST', 'SOUTH_EAST', 'SOUTH', 'SOUTH_WEST', 'WEST', 'NORTH_WEST');

-- AlterTable
ALTER TABLE "Property" DROP COLUMN "facing",
ADD COLUMN     "facing" "Facing";
