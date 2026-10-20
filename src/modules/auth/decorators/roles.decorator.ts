import { SetMetadata } from "@nestjs/common";
import type { USER_ROLE } from "../../users/types/user.types.js";

export const ROLES_KEY = "roles";

export const Roles = (...roles: Array<USER_ROLE>) =>
  SetMetadata(ROLES_KEY, roles);
