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
import { PropertiesService } from "./properties.service.js";
import {
  createPropertySchema,
  listArchivedPropertiesSchema,
  listPropertiesSchema,
  updatePropertySchema,
  type CreatePropertyInput,
  type ListArchivedPropertiesInput,
  type ListPropertiesInput,
  type UpdatePropertyInput,
} from "./properties.schema.js";

@Controller("properties")
@UseGuards(RolesGuard)
@Roles("AGENT")
export class PropertiesController {
  constructor(private readonly properties: PropertiesService) {}

  @Post()
  create(
    @CurrentUser() auth: AuthenticatedUser,
    @Body(new ZodValidationPipe(createPropertySchema))
    input: CreatePropertyInput,
  ) {
    return this.properties.create(auth.userId, input);
  }

  @Get()
  list(
    @CurrentUser() auth: AuthenticatedUser,
    @Query(new ZodValidationPipe(listPropertiesSchema))
    input: ListPropertiesInput,
  ) {
    return this.properties.list(auth.userId, input);
  }

  @Get("archived")
  listArchived(
    @CurrentUser() auth: AuthenticatedUser,
    @Query(new ZodValidationPipe(listArchivedPropertiesSchema))
    input: ListArchivedPropertiesInput,
  ) {
    return this.properties.listArchived(auth.userId, input);
  }

  @Get(":id")
  get(
    @CurrentUser() auth: AuthenticatedUser,
    @Param("id", new ZodValidationPipe(uuidSchema)) id: string,
  ) {
    return this.properties.get(auth.userId, id);
  }

  @Patch(":id")
  update(
    @CurrentUser() auth: AuthenticatedUser,
    @Param("id", new ZodValidationPipe(uuidSchema)) id: string,
    @Body(new ZodValidationPipe(updatePropertySchema))
    input: UpdatePropertyInput,
  ) {
    return this.properties.update(auth.userId, id, input);
  }

  @Post(":id/archive")
  archive(
    @CurrentUser() auth: AuthenticatedUser,
    @Param("id", new ZodValidationPipe(uuidSchema)) id: string,
  ) {
    return this.properties.archive(auth.userId, id);
  }

  @Delete(":id/delete")
  delete(
    @CurrentUser() auth: AuthenticatedUser,
    @Param("id", new ZodValidationPipe(uuidSchema)) id: string,
  ) {
    return this.properties.delete(auth.userId, id);
  }
}
