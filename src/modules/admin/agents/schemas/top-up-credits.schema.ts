import { z } from "zod";

export const topUpCreditsSchema = z
  .object({
    credits: z.coerce.bigint().positive(),

    referenceId: z.string().trim().max(100).optional(),

    description: z.string().trim().max(500).optional(),
  })
  .strict();

export type TopUpCreditsInput = z.infer<typeof topUpCreditsSchema>;
