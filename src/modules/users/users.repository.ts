import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service.js";
import type { USER_ROLE, USER_STATUS } from "./types/user.types.js";
import { Prisma } from "../../database/prisma-client.js";
import { NotFoundError } from "../../common/errors/app-error.js";

@Injectable()
export class UsersRepository {
  constructor(private readonly db: DatabaseService) {}

  //
  findByEmail(email: string) {
    return this.db.user.findUnique({ where: { email } });
  }

  //
  findById(id: string) {
    return this.db.user.findUnique({
      where: {
        id,
      },
    });
  }

  //
  create(data: {
    email: string;
    name: string;
    passwordHash: string;
    role: USER_ROLE;
    status: USER_STATUS;
  }) {
    return this.db.user.create({
      data,
    });
  }

  //
  private agentWhere(
    search?: string,
    status?: USER_STATUS,
  ): Prisma.UserWhereInput {
    return {
      role: "AGENT",
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };
  }

  findAgents(params: {
    search?: string;
    status?: USER_STATUS;
    skip: number;
    take: number;
  }) {
    return this.db.user.findMany({
      where: this.agentWhere(params.search, params.status),
      orderBy: {
        createdAt: "desc",
      },
      skip: params.skip,
      take: params.take,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  //
  countAgents(search?: string, status?: USER_STATUS) {
    return this.db.user.count({
      where: this.agentWhere(search, status),
    });
  }

  findAgent(id: string) {
    return this.db.user.findFirst({
      where: { id, role: "AGENT" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async setAgentStatus(id: string, status: USER_STATUS) {
    return this.db.transaction(async (tx) => {
      const updated = await tx.user.updateMany({
        where: { id, role: "AGENT" },
        data: { status },
      });
      if (updated.count !== 1) throw new NotFoundError("Agent not found");
      if (status !== "ACTIVE") {
        await tx.refreshSession.updateMany({
          where: { userId: id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      return tx.user.findUniqueOrThrow({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });
  }

  async revokeAgentSessions(id: string) {
    return this.db.transaction(async (tx) => {
      const agent = await tx.user.findFirst({
        where: { id, role: "AGENT" },
        select: { id: true },
      });
      if (!agent) throw new NotFoundError("Agent not found");
      const result = await tx.refreshSession.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return { revokedSessions: result.count };
    });
  }

  //
}
