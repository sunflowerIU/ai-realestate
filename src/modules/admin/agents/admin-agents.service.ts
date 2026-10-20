import { Injectable } from "@nestjs/common";
import { UsersRepository } from "../../users/users.repository.js";
import { PasswordService } from "../../auth/password.service.js";
import { AppError } from "../../../common/errors/app-error.js";
import { ErrorCode } from "../../../common/errors/error-code.js";
import { RefreshSessionRepository } from "../../auth/refresh-session-repository.js";
import type { CreateAgentInput } from "./schemas/create-agent.schema.js";
import type { ListAgentsInput } from "./schemas/list-agents.schema.js";
import { toPagination } from "../../../common/pagination/pagination.schema.js";

@Injectable()
export class AdminAgentService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordService: PasswordService,
    private readonly sessions: RefreshSessionRepository,
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

    const user = await this.usersRepository.create({
      name: input.name.trim(),
      email,
      passwordHash,
      role: "AGENT",
      status: "ACTIVE",
    });

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
        take: pagination.take,
        skip: pagination.skip,
      }),
      this.usersRepository.countAgents(input.search),
    ]);

    return {
      agents,
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total,
        totalPages: Math.ceil(total / pagination.pageSize),
      },
    };
  }

  //
  private async ensureAgent(id: string) {
    const user = await this.usersRepository.findById(id);

    if (!user || user.role !== "AGENT") {
      throw new AppError(ErrorCode.NOT_FOUND, "Agent not found", 404);
    }

    return user;
  }

  //
  async suspendAgent(id: string) {
    await this.ensureAgent(id);

    await this.usersRepository.updateStatus(id, "SUSPENDED");

    await this.sessions.revokeAllForUser(id);

    return {
      success: true,
    };
  }

  //
  async banAgent(id: string) {
    await this.ensureAgent(id);

    await this.usersRepository.updateStatus(id, "BANNED");

    await this.sessions.revokeAllForUser(id);

    return {
      success: true,
    };
  }

  //
  async activateAgent(id: string) {
    await this.ensureAgent(id);

    await this.usersRepository.updateStatus(id, "ACTIVE");

    return {
      success: true,
    };
  }
}
