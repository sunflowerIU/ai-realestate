import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import { uuidSchema } from "../../common/pipes/uuid.schema.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import type { AuthenticatedUser } from "../auth/types/authenticated-user.js";
import { RequirementsService } from "./requirements.service.js";
import {
  createRequirementSchema,
  listRequirementsSchema,
  updateRequirementSchema,
  type CreateRequirementInput,
  type ListRequirementsInput,
  type UpdateRequirementInput,
} from "./requirements.schema.js";

@Controller("requirements")
@UseGuards(RolesGuard)
@Roles("AGENT")
export class RequirementsController {
  constructor(private readonly requirements: RequirementsService) {}

  @Post()
  create(
    @CurrentUser() auth: AuthenticatedUser,
    @Body(new ZodValidationPipe(createRequirementSchema))
    input: CreateRequirementInput,
  ) {
    return this.requirements.create(auth.userId, input);
  }

  @Get()
  list(
    @CurrentUser() auth: AuthenticatedUser,
    @Query(new ZodValidationPipe(listRequirementsSchema))
    input: ListRequirementsInput,
  ) {
    return this.requirements.list(auth.userId, input);
  }

  @Get(":id")
  get(
    @CurrentUser() auth: AuthenticatedUser,
    @Param("id", new ZodValidationPipe(uuidSchema)) id: string,
  ) {
    return this.requirements.get(auth.userId, id);
  }

  @Patch(":id")
  update(
    @CurrentUser() auth: AuthenticatedUser,
    @Param("id", new ZodValidationPipe(uuidSchema)) id: string,
    @Body(new ZodValidationPipe(updateRequirementSchema))
    input: UpdateRequirementInput,
  ) {
    return this.requirements.update(auth.userId, id, input);
  }

  @Delete(":id/delete")
  delete(
    @CurrentUser() auth: AuthenticatedUser,
    @Param("id", new ZodValidationPipe(uuidSchema)) id: string,
  ) {
    return this.requirements.delete(auth.userId, id);
  }
}
