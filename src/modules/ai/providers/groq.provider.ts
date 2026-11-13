import { Injectable } from "@nestjs/common";
import Groq from "groq-sdk";
import type {
  AiProvider,
  ProviderResult,
  ProviderStructuredRequest,
} from "./ai-provider.interface.js";
import { AI_PROVIDER } from "../types/ai-provider-name.js";
import type { ConfigService } from "@nestjs/config";

@Injectable()
export class GroqProvider implements AiProvider {
  readonly name = AI_PROVIDER.GROQ;

  private readonly client: Groq;

  constructor(private readonly config: ConfigService) {
    this.client = new Groq({
      apiKey: this.config.getOrThrow<string>("GROQ_API_KEY"),
    });
  }

  async generateStructured<T>(
    request: ProviderStructuredRequest<T>,
  ): Promise<ProviderResult<T>> {
    const startedAt = Date.now();
    const completion = await this.client.chat.completions.create({
      model: request.model,
      messages: [
        ...(request.systemPrompt
          ? [{ role: "system" as const, content: request.systemPrompt }]
          : []),
        {
          role: "user",
          content: request.prompt,
        },
      ],
      max_tokens: request.maxOutputTokens ?? null,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: request.output.name,
          strict: true,
          schema: request.output.jsonSchema,
        },
      },
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new Error("Groq returned an empty response");
    }

    const parsed: unknown = JSON.parse(content);
    const validated = request.output.validator.parse(parsed);

    return {
      data: validated,
      provider: this.name,
      model: request.model,
      ...(completion.usage?.prompt_tokens !== undefined && {
        inputTokens: completion.usage?.prompt_tokens,
      }),
      ...(completion.usage?.completion_tokens !== undefined && {
        outputTokens: completion.usage?.completion_tokens,
      }),
      providerRequestId: completion.id,
      latencyMs: Date.now() - startedAt,
    };
  }
}
