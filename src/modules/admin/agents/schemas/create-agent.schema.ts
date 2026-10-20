import { z } from "zod";

import { passwordSchema } from "../../../auth/schemas/password.schema.js";

export const createAgentSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(320),
    password: passwordSchema,
  })
  .strict();

export type CreateAgentInput = z.infer<typeof createAgentSchema>;
