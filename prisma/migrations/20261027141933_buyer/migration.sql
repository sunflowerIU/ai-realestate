/*
  Warnings:

  - Added the required column `buyerName` to the `BuyerRequirement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `buyerPhoneNo` to the `BuyerRequirement` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BuyerRequirement" ADD COLUMN     "buyerEmail" TEXT,
ADD COLUMN     "buyerName" TEXT NOT NULL,
ADD COLUMN     "buyerPhoneNo" TEXT NOT NULL;
