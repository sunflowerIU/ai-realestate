import { Injectable } from "@nestjs/common";
import { GoogleGenAI } from "@google/genai";
import type {
  AiProvider,
  ProviderResult,
  ProviderStructuredRequest,
} from "./ai-provider.interface.js";
import { AI_PROVIDER } from "../types/ai-provider-name.js";
import type { ConfigService } from "@nestjs/config";

@Injectable()
export class GeminiProvider implements AiProvider {
  readonly name = AI_PROVIDER.GEMINI;
  private readonly client: GoogleGenAI;

  constructor(private readonly config: ConfigService) {
    this.client = new GoogleGenAI({
      apiKey: this.config.getOrThrow<string>("GEMINI_API_KEY"),
    });
  }

  async generateStructured<T>(
    request: ProviderStructuredRequest<T>,
  ): Promise<ProviderResult<T>> {
    const startedAt = Date.now();

    const interaction = await this.client.interactions.create({
      model: request.model,
      system_instruction: request.systemPrompt,
      input: request.prompt,
      generation_config: {
        max_output_tokens: request.maxOutputTokens,
      },
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: request.output.jsonSchema,
      },
    });

    const result = interaction as unknown as {
      id: string;
      output_text?: string;
      usage?: {
        total_input_tokens?: number;
        total_output_tokens?: number;
      };
    };

    if (!result.output_text) {
      throw new Error("Gemini returned an empty response");
    }

    const parsed: unknown = JSON.parse(result.output_text);

    const validated = request.output.validator.parse(parsed);

    return {
      data: validated,
      provider: this.name,
      model: request.model,
      ...(result.usage?.total_input_tokens !== undefined && {
        inputTokens: result.usage?.total_input_tokens,
      }),
      ...(result.usage?.total_output_tokens !== undefined && {
        outputTokens: result.usage?.total_output_tokens,
      }),
      providerRequestId: result.id,
      latencyMs: Date.now() - startedAt,
    };
  }
}
