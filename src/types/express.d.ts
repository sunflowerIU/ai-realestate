import type { AuthenticatedUser } from "../modules/auth/types/authenticated-user.ts";

declare global {
  namespace Express {
    interface Request {
      auth?: AuthenticatedUser;
    }
  }
}

export {};
