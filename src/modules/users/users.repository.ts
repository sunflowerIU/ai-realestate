import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service.js";
import type { USER_ROLE, USER_STATUS } from "./types/user.types.js";

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
  findAgents(params: { search?: string; skip: number; take: number }) {
    return this.db.user.findMany({
      where: {
        role: "AGENT",
        ...(params.search
          ? {
              OR: [
                {
                  name: {
                    contains: params.search,
                    mode: "insensitive",
                  },
                },
                {
                  email: {
                    contains: params.search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : []),
      },
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
  countAgents(search?: string) {
    return this.db.user.count({
      where: {
        role: "AGENT",
        ...(search
          ? {
              OR: [
                {
                  name: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  email: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
      },
    });
  }

  //
  updateStatus(id: string, status: USER_STATUS) {
    return this.db.user.update({
      where: {
        id,
      },
      data: {
        status,
      },
    });
  }
}
