import type { AiOperation } from "../../../generated/prisma/enums.js";

export interface ReservedCreditsInput {
  agentId: string;
  operation: AiOperation;
  credits: bigint;
  idempotencyKey: string;
  expiresAt: Date;
}

export interface SettleCreditsInput {
  reservationId: string;
  chargedCredits: bigint;
}

export interface ReleaseCreditsInput {
  reservationId: string;
}

export interface TopUpCreditsInput {
  agentId: string;
  credits: bigint;

  referenceId?: string;
  description?: string;
}
