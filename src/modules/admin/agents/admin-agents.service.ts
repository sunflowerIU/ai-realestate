import { Injectable } from "@nestjs/common";
import { UsersRepository } from "../../users/users.repository.js";
import { PasswordService } from "../../auth/password.service.js";
import { AppError } from "../../../common/errors/app-error.js";
import { ErrorCode } from "../../../common/errors/error-code.js";
import { Prisma } from "../../../database/prisma-client.js";
import { paginate } from "../../../common/pagination/pagination.js";
import type { CreateAgentInput } from "./schemas/create-agent.schema.js";
import type { ListAgentsInput } from "./schemas/list-agents.schema.js";
import { toPagination } from "../../../common/pagination/pagination.schema.js";

@Injectable()
export class AdminAgentService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordService: PasswordService,
  ) {}

  //
  async createAgent(input: CreateAgentInput) {
    const email = input.email.trim().toLowerCase();

    const existing = await this.usersRepository.findByEmail(email);

    if (existing) {
      throw new AppError(
        ErrorCode.CONFLICT,
        "An account with this email already exists",
        409,
      );
    }
    const passwordHash = await this.passwordService.hash(input.password);

    let user;
    try {
      user = await this.usersRepository.create({
        name: input.name.trim(), email, passwordHash, role: "AGENT", status: "ACTIVE",
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError(ErrorCode.CONFLICT, "An account with this email already exists", 409);
      }
      throw error;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    };
  }

  //
  async listAgents(input: ListAgentsInput) {
    const pagination = toPagination(input);

    const [agents, total] = await Promise.all([
      this.usersRepository.findAgents({
        search: input.search ?? "",
        ...(input.status ? { status: input.status } : {}),
        take: pagination.take,
        skip: pagination.skip,
      }),
      this.usersRepository.countAgents(input.search, input.status),
    ]);

    return paginate(agents, pagination.page, pagination.pageSize, total);
  }

  async getAgent(id: string) {
    const agent = await this.usersRepository.findAgent(id);
    if (!agent) throw new AppError(ErrorCode.NOT_FOUND, "Agent not found", 404);
    return agent;
  }

  revokeSessions(id: string) {
    return this.usersRepository.revokeAgentSessions(id);
  }

  //
  async suspendAgent(id: string) {
    return this.usersRepository.setAgentStatus(id, "SUSPENDED");
  }

  //
  async banAgent(id: string) {
    return this.usersRepository.setAgentStatus(id, "BANNED");
  }

  //
  async activateAgent(id: string) {
    return this.usersRepository.setAgentStatus(id, "ACTIVE");
  }
}
