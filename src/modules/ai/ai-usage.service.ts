import { Injectable } from "@nestjs/common";
import type { DatabaseService } from "../../database/database.service.js";
import type { AiOperation } from "../../generated/prisma/enums.js";

@Injectable()
export class AiUsageService {
  constructor(private readonly db: DatabaseService) {}

  //
  record(input: {
    agentId: string;

    operation: AiOperation;

    provider: string;
    model: string;

    inputTokens?: number;
    outputTokens?: number;

    creditsCharged: bigint;

    providerRequestId?: string;

    latencyMs: number;
  }) {
    return this.db.aiUsage.create({
      data: {
        agentId: input.agentId,
        operation: input.operation,
        provider: input.provider,
        model: input.model,
        inputTokens: input.inputTokens ?? null,
        outputTokens: input.outputTokens ?? null,
        creditsCharged: input.creditsCharged,
        providerRequestId: input.providerRequestId ?? null,
        latencyMs: input.latencyMs,
      },
    });
  }
}
