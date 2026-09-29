import { z } from "zod";

import { passwordSchema } from "./password.schema.js";

export const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(100),

    email: z.string().trim().email().max(320),

    password: passwordSchema,
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
