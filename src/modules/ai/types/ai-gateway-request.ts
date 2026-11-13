import type { AiOperation } from "../../../generated/prisma/enums.js";
import type { StructuredOutputDefinition } from "./structured-output.js";

export interface AiGatewayRequest<T> {
  agentId: string;
  operation: AiOperation;
  systemPrompt?: string;
  prompt: string;
  idempotencyKey: string;
  output: StructuredOutputDefinition<T>;
}
