import type z from "zod";

export interface StructuredOutputDefinition<T> {
  name: string;
  jsonSchema: Record<string, unknown>;
  validator: z.ZodType<T>;
}
