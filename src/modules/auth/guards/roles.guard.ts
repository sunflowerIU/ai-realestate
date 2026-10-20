import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator.js";
import { AppError } from "../../../common/errors/app-error.js";
import { ErrorCode } from "../../../common/errors/error-code.js";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  //
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    const auth = request.auth;

    if (!auth || !requiredRoles.includes(auth.role)) {
      throw new AppError(ErrorCode.FORBIDDEN, "Forbidden", 403);
    }

    return true;
  }
}
