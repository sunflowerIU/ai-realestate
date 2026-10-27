import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AdminAgentService } from "./admin-agents.service.js";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe.js";
import {
  createAgentSchema,
  type CreateAgentInput,
} from "./schemas/create-agent.schema.js";
import { RolesGuard } from "../../auth/guards/roles.guard.js";
import { Roles } from "../../auth/decorators/roles.decorator.js";
import { uuidSchema } from "../../../common/pipes/uuid.schema.js";
import {
  listAgentsSchema,
  type ListAgentsInput,
} from "./schemas/list-agents.schema.js";

@Controller("admin/agents")
@UseGuards(RolesGuard)
@Roles("PLATFORM_ADMIN")
export class AdminAgentController {
  constructor(private readonly adminAgentsService: AdminAgentService) {}

  //
  @Post()
  createAgent(
    @Body(new ZodValidationPipe(createAgentSchema)) input: CreateAgentInput,
  ) {
    return this.adminAgentsService.createAgent(input);
  }

  //
  @Get()
  listAgents(
    @Query(new ZodValidationPipe(listAgentsSchema)) query: ListAgentsInput,
  ) {
    return this.adminAgentsService.listAgents(query);
  }

  @Get(":id")
  getAgent(@Param("id", new ZodValidationPipe(uuidSchema)) id: string) {
    return this.adminAgentsService.getAgent(id);
  }

  //
  @Post(":id/suspend")
  suspendAgent(@Param("id", new ZodValidationPipe(uuidSchema)) id: string) {
    return this.adminAgentsService.suspendAgent(id);
  }

  //
  @Post(":id/ban")
  banAgent(@Param("id", new ZodValidationPipe(uuidSchema)) id: string) {
    return this.adminAgentsService.banAgent(id);
  }

  //
  @Post(":id/activate")
  activateAgent(@Param("id", new ZodValidationPipe(uuidSchema)) id: string) {
    return this.adminAgentsService.activateAgent(id);
  }

  @Post(":id/revoke-sessions")
  revokeSessions(@Param("id", new ZodValidationPipe(uuidSchema)) id: string) {
    return this.adminAgentsService.revokeSessions(id);
  }
}
