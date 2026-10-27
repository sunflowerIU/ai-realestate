import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import { uuidSchema } from "../../common/pipes/uuid.schema.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import type { AuthenticatedUser } from "../auth/types/authenticated-user.js";
import { VisitsService } from "./visits.service.js";
import { createVisitSchema, listVisitsSchema, updateVisitSchema, type CreateVisitInput, type ListVisitsInput, type UpdateVisitInput } from "./visits.schema.js";

@Controller("visits")
@UseGuards(RolesGuard)
@Roles("AGENT")
export class VisitsController {
  constructor(private readonly visits: VisitsService) {}

  @Post()
  create(@CurrentUser() auth: AuthenticatedUser, @Body(new ZodValidationPipe(createVisitSchema)) input: CreateVisitInput) {
    return this.visits.create(auth.userId, input);
  }

  @Get()
  list(@CurrentUser() auth: AuthenticatedUser, @Query(new ZodValidationPipe(listVisitsSchema)) input: ListVisitsInput) {
    return this.visits.list(auth.userId, input);
  }

  @Get(":id")
  get(@CurrentUser() auth: AuthenticatedUser, @Param("id", new ZodValidationPipe(uuidSchema)) id: string) {
    return this.visits.get(auth.userId, id);
  }

  @Patch(":id")
  update(@CurrentUser() auth: AuthenticatedUser, @Param("id", new ZodValidationPipe(uuidSchema)) id: string, @Body(new ZodValidationPipe(updateVisitSchema)) input: UpdateVisitInput) {
    return this.visits.update(auth.userId, id, input);
  }
}
