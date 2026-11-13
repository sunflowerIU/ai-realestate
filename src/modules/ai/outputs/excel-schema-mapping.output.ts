import { z } from "zod";

import type { StructuredOutputDefinition } from "../types/structured-output.js";

export const ExcelColumnMappingSchema = z
  .object({
    mappings: z.array(
      z
        .object({
          sourceColumn: z.string(),

          targetField: z.string().nullable(),

          confidence: z.number().min(0).max(1),

          reason: z.string(),
        })
        .strict(),
    ),

    unmappedColumns: z.array(z.string()),
  })
  .strict();

export type ExcelColumnMapping = z.infer<typeof ExcelColumnMappingSchema>;

export const excelColumnMappingOutput: StructuredOutputDefinition<ExcelColumnMapping> =
  {
    name: "excel_schema_mapping",

    validator: ExcelColumnMappingSchema,

    jsonSchema: {
      type: "object",

      properties: {
        mappings: {
          type: "array",

          items: {
            type: "object",

            properties: {
              sourceColumn: {
                type: "string",
              },

              targetField: {
                type: ["string", "null"],
              },

              confidence: {
                type: "number",
                minimum: 0,
                maximum: 1,
              },

              reason: {
                type: "string",
              },
            },

            required: ["sourceColumn", "targetField", "confidence", "reason"],

            additionalProperties: false,
          },
        },

        unmappedColumns: {
          type: "array",
          items: {
            type: "string",
          },
        },
      },

      required: ["mappings", "unmappedColumns"],

      additionalProperties: false,
    },
  };
