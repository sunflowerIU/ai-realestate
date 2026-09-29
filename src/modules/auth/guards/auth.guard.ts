import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { AppError } from "../../../common/errors/app-error.js";
import { ErrorCode } from "../../../common/errors/error-code.js";
import type { AccessTokenPayload } from "../types/access-token-payload.js";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator.js";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  //
  async canActivate(context: ExecutionContext): Promise<boolean> {
    //if the decorator has IS_PUBLIC_KEY set to true then skip auth guard
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    const token = this.extractBearerToken(request.headers.authorization);

    if (!token) {
      throw this.unauthorized();
    }

    try {
      const payload =
        await this.jwtService.verifyAsync<AccessTokenPayload>(token);

      if (!payload.sub || !payload.sessionId) {
        throw this.unauthorized();
      }

      request.auth = {
        userId: payload.sub,
        sessionId: payload.sessionId,
      };
      return true;
    } catch (error) {
      throw this.unauthorized();
    }
  }

  //
  private extractBearerToken(authorization?: string): string | null {
    if (!authorization) {
      return null;
    }

    const [type, token] = authorization.split(" ");

    if (type !== "Bearer" || !token) {
      return null;
    }

    return token;
  }

  //
  private unauthorized() {
    return new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
  }
}
