import type { USER_ROLE } from "../../users/types/user.types.js";

export interface AccessTokenPayload {
  sub: string;
  sessionId: string;
  role: USER_ROLE;
}
