import { Injectable } from "@nestjs/common";
import type { AiProviderName } from "../types/ai-provider-name.js";
import type { AiProvider } from "./ai-provider.interface.js";
import { GroqProvider } from "./groq.provider.js";
import { GeminiProvider } from "./gemini.provider.js";

@Injectable()
export class AiProviderRegistry {
  private readonly providers: Map<AiProviderName, AiProvider>;

  constructor(groq: GroqProvider, gemini: GeminiProvider) {
    const entries: ["GEMINI" | "GROQ", GeminiProvider | GroqProvider][] = [
      [groq.name, groq],
      [gemini.name, gemini],
    ];

    this.providers = new Map(entries);
  }

  //
  get(providerName: AiProviderName): AiProvider {
    const provider = this.providers.get(providerName);

    if (!provider) {
      throw new Error(`AI provider not registered: ${providerName}`);
    }

    return provider;
  }
}
