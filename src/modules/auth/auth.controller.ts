import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import { loginSchema, type LoginInput } from "./schemas/login.schema.js";
import { refreshSchema, type RefreshInput } from "./schemas/refresh.schema.js";
import { logoutSchema, type LogoutInput } from "./schemas/logout.schema.js";
import { CurrentUser } from "./decorators/current-user.decorator.js";
import type { AuthenticatedUser } from "./types/authenticated-user.js";
import { Public } from "./decorators/public.decorator.js";

@Controller({ path: "auth", version: "1" })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @Public()
  login(@Body(new ZodValidationPipe(loginSchema)) input: LoginInput) {
    return this.authService.login(input);
  }

  @Post("refresh")
  @Public()
  refresh(@Body(new ZodValidationPipe(refreshSchema)) input: RefreshInput) {
    return this.authService.refresh(input);
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Body(new ZodValidationPipe(logoutSchema)) input: LogoutInput,
  ): Promise<void> {
    await this.authService.logout(input);
  }

  @Get("protected-test")
  protectedTest() {
    return {
      message: "You are authenticated",
    };
  }

  @Get("me")
  me(@CurrentUser() auth: AuthenticatedUser) {
    return this.authService.getCurrentUser(auth.userId);
  }
}
