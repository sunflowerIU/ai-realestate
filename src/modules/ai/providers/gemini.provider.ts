// providers/gemini.provider.ts

import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleGenAI } from "@google/genai";

import { AI_PROVIDER } from "../types/ai-provider-name.js";

import type {
  AiProvider,
  AiProviderRequest,
  AiProviderResult,
} from "./ai-provider.interface.js";

@Injectable()
export class GeminiProvider implements AiProvider {
  readonly name = AI_PROVIDER.GEMINI;

  private readonly client: GoogleGenAI;

  constructor(config: ConfigService) {
    this.client = new GoogleGenAI({
      apiKey: config.getOrThrow<string>("GEMINI_API_KEY"),
    });
  }

  async generateStructured<T>(
    input: AiProviderRequest<T>,
  ): Promise<AiProviderResult<T>> {
    const startedAt = Date.now();

    const response = await this.client.interactions.create({
      model: input.model,

      input: input.prompt,

      system_instruction: input.systemPrompt,

      generation_config: {
        max_output_tokens: input.maxOutputTokens,
      },

      response_format: {
        type: "text",

        mime_type: "application/json",

        schema: input.output.jsonSchema,
      },
    });

    if (!response.output_text) {
      throw new Error("Gemini returned an empty response");
    }

    const raw: unknown = JSON.parse(response.output_text);

    const data = input.output.validator.parse(raw);

    return {
      data,

      provider: this.name,
      model: input.model,

      ...(response.usage?.total_input_tokens && {
        inputTokens: response.usage?.total_input_tokens,
      }),

      ...(response.usage?.total_output_tokens && {
        outputTokens: response.usage?.total_output_tokens,
      }),

      providerRequestId: response.id,

      latencyMs: Date.now() - startedAt,
    };
  }
}
