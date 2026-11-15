import { z } from "zod";

import { MAX_EXCEL_UPLOAD_BYTES } from "../excel-import.constants.js";

export const createExcelUploadSchema = z
  .object({
    fileName: z
      .string()
      .trim()
      .min(1)
      .max(255)
      .refine(
        (value) => value.toLowerCase().endsWith(".xlsx"),
        "Only .xlsx files are supported",
      ),

    fileSizeBytes: z.number().int().positive().max(MAX_EXCEL_UPLOAD_BYTES),
  })
  .strict();

export type CreateExcelUploadInput = z.infer<typeof createExcelUploadSchema>;
