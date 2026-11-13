export const AI_PROVIDER = {
  GROQ: "GROQ",
  GEMINI: "GEMINI",
} as const;

export type AiProviderName = (typeof AI_PROVIDER)[keyof typeof AI_PROVIDER];
