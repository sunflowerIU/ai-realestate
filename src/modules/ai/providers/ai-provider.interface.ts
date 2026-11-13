import type { AiProviderName } from "../types/ai-provider-name.js";
import type { StructuredOutputDefinition } from "../types/structured-output.js";

export interface ProviderStructuredRequest<T> {
  model: string;
  systemPrompt?: string;
  prompt: string;

  maxOutputTokens?: number;

  output: StructuredOutputDefinition<T>;
}

export interface ProviderResult<T> {
  data: T;
  provider: AiProviderName;
  model: string;

  inputTokens?: number;
  outputTokens?: number;

  providerRequestId?: string;

  latencyMs: number;
}

export interface AiProvider {
  readonly name: AiProviderName;

  generateStructured<T>(
    request: ProviderStructuredRequest<T>,
  ): Promise<ProviderResult<T>>;
}
