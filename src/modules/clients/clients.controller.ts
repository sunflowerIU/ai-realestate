import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import type { AuthenticatedUser } from "../auth/types/authenticated-user.js";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import { ClientsService } from "./clients.service.js";
import { clientIdSchema, createClientSchema, listClientsSchema, updateClientSchema, type CreateClientInput, type ListClientsInput, type UpdateClientInput } from "./clients.schema.js";

@Controller("clients")
@UseGuards(RolesGuard)
@Roles("AGENT")
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Post()
  create(@CurrentUser() auth: AuthenticatedUser, @Body(new ZodValidationPipe(createClientSchema)) input: CreateClientInput) {
    return this.clients.create(auth.userId, input);
  }

  @Get()
  list(@CurrentUser() auth: AuthenticatedUser, @Query(new ZodValidationPipe(listClientsSchema)) input: ListClientsInput) {
    return this.clients.list(auth.userId, input);
  }

  @Get(":id")
  get(@CurrentUser() auth: AuthenticatedUser, @Param("id", new ZodValidationPipe(clientIdSchema)) id: string) {
    return this.clients.get(auth.userId, id);
  }

  @Patch(":id")
  update(@CurrentUser() auth: AuthenticatedUser, @Param("id", new ZodValidationPipe(clientIdSchema)) id: string, @Body(new ZodValidationPipe(updateClientSchema)) input: UpdateClientInput) {
    return this.clients.update(auth.userId, id, input);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@CurrentUser() auth: AuthenticatedUser, @Param("id", new ZodValidationPipe(clientIdSchema)) id: string) {
    return this.clients.delete(auth.userId, id);
  }
}
