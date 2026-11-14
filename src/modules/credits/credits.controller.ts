import { Controller, Get } from "@nestjs/common";
import { Roles } from "../auth/decorators/roles.decorator.js";
import type { CreditService } from "./credit.service.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import type { AuthenticatedUser } from "../auth/types/authenticated-user.js";

@Controller()
@Roles("AGENT")
export class creditsController {
  constructor(private readonly creditService: CreditService) {}

  @Get("balance")
  getBalance(@CurrentUser() auth: AuthenticatedUser) {
    return this.creditService.getBalance(auth.userId);
  }
}
