import type { AiOperation } from "../../generated/prisma/enums.js";
import type { AiProviderName } from "./types/ai-provider-name.js";

export interface ModelTarget {
  provider: AiProviderName;
  model: string;
}

export interface ModelRoute {
  primary: ModelTarget;
  fallback?: ModelTarget;

  maxOutputTokens: number;
}

export const MODEL_REGISTRY: Partial<Record<AiOperation, ModelRoute>> = {
  EXCEL_SCHEMA_MAPPING: {
    primary: {
      provider: "GROQ",
      model: "openai/gpt-oss-20b",
    },

    fallback: {
      provider: "GEMINI",
      model: "gemini-3.5-flash-lite",
    },

    maxOutputTokens: 1500,
  },

  EXCEL_AMBIGUITY_RESOLUTION: {
    primary: {
      provider: "GROQ",
      model: "openai/gpt-oss-20b",
    },

    fallback: {
      provider: "GEMINI",
      model: "gemini-3.5-flash-lite",
    },

    maxOutputTokens: 2000,
  },
};
