import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import { uuidSchema } from "../../common/pipes/uuid.schema.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import type { AuthenticatedUser } from "../auth/types/authenticated-user.js";
import { DealsService } from "./deals.service.js";
import { createDealSchema, listDealsSchema, updateDealSchema, type CreateDealInput, type ListDealsInput, type UpdateDealInput } from "./deals.schema.js";

@Controller("deals")
@UseGuards(RolesGuard)
@Roles("AGENT")
export class DealsController {
  constructor(private readonly deals: DealsService) {}

  @Post()
  create(@CurrentUser() auth: AuthenticatedUser, @Body(new ZodValidationPipe(createDealSchema)) input: CreateDealInput) {
    return this.deals.create(auth.userId, input);
  }

  @Get()
  list(@CurrentUser() auth: AuthenticatedUser, @Query(new ZodValidationPipe(listDealsSchema)) input: ListDealsInput) {
    return this.deals.list(auth.userId, input);
  }

  @Get(":id")
  get(@CurrentUser() auth: AuthenticatedUser, @Param("id", new ZodValidationPipe(uuidSchema)) id: string) {
    return this.deals.get(auth.userId, id);
  }

  @Patch(":id")
  update(@CurrentUser() auth: AuthenticatedUser, @Param("id", new ZodValidationPipe(uuidSchema)) id: string, @Body(new ZodValidationPipe(updateDealSchema)) input: UpdateDealInput) {
    return this.deals.update(auth.userId, id, input);
  }
}
