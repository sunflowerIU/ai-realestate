import { z } from "zod";

export const logoutSchema = z
  .object({
    refreshToken: z.string().min(32),
  })
  .strict();

export type LogoutInput = z.infer<typeof logoutSchema>;
