import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import { uuidSchema } from "../../common/pipes/uuid.schema.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import type { AuthenticatedUser } from "../auth/types/authenticated-user.js";
import { ActivitiesService } from "./activities.service.js";
import { createActivitySchema, listActivitiesSchema, updateActivitySchema, type CreateActivityInput, type ListActivitiesInput, type UpdateActivityInput } from "./activities.schema.js";

@Controller("activities")
@UseGuards(RolesGuard)
@Roles("AGENT")
export class ActivitiesController {
  constructor(private readonly activities: ActivitiesService) {}

  @Post()
  create(@CurrentUser() auth: AuthenticatedUser, @Body(new ZodValidationPipe(createActivitySchema)) input: CreateActivityInput) {
    return this.activities.create(auth.userId, input);
  }

  @Get()
  list(@CurrentUser() auth: AuthenticatedUser, @Query(new ZodValidationPipe(listActivitiesSchema)) input: ListActivitiesInput) {
    return this.activities.list(auth.userId, input);
  }

  @Get(":id")
  get(@CurrentUser() auth: AuthenticatedUser, @Param("id", new ZodValidationPipe(uuidSchema)) id: string) {
    return this.activities.get(auth.userId, id);
  }

  @Patch(":id")
  update(@CurrentUser() auth: AuthenticatedUser, @Param("id", new ZodValidationPipe(uuidSchema)) id: string, @Body(new ZodValidationPipe(updateActivitySchema)) input: UpdateActivityInput) {
    return this.activities.update(auth.userId, id, input);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@CurrentUser() auth: AuthenticatedUser, @Param("id", new ZodValidationPipe(uuidSchema)) id: string) {
    return this.activities.delete(auth.userId, id);
  }
}
