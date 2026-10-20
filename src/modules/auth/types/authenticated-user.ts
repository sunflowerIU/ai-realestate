import type { USER_ROLE } from "../../users/types/user.types.js";

export interface AuthenticatedUser {
  userId: string;
  sessionId: string;
  role: USER_ROLE;
}
