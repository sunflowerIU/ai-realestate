-- CreateEnum
CREATE TYPE "ImportType" AS ENUM ('EXCEL');

-- CreateEnum
CREATE TYPE "ImportJobStatus" AS ENUM ('AWAITING_UPLOAD', 'UPLOADED', 'QUEUED', 'PROCESSING', 'REVIEW_REQUIRED', 'COMPLETED', 'FAILED', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "type" "ImportType" NOT NULL DEFAULT 'EXCEL',
    "status" "ImportJobStatus" NOT NULL DEFAULT 'AWAITING_UPLOAD',
    "objectKey" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "fileSizeBytes" BIGINT,
    "uploadedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ImportJob_objectKey_key" ON "ImportJob"("objectKey");

-- CreateIndex
CREATE INDEX "ImportJob_agentId_status_createdAt_idx" ON "ImportJob"("agentId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ImportJob_agentId_createdAt_idx" ON "ImportJob"("agentId", "createdAt");

-- CreateIndex
CREATE INDEX "ImportJob_expiresAt_idx" ON "ImportJob"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ImportJob_id_agentId_key" ON "ImportJob"("id", "agentId");

-- AddForeignKey
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
