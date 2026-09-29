import { Inject, Injectable, type OnApplicationShutdown } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Environment } from "../config/environment.js";
import { createPrismaClient, type PrismaClient } from "./prisma-client.js";

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  private readonly prisma: PrismaClient;

  constructor(@Inject(ConfigService) config: ConfigService<Environment, true>) {
    this.prisma = createPrismaClient(config.get("DATABASE_URL", { infer: true }));
  }

  get user(): PrismaClient["user"] {
    return this.prisma.user;
  }

  get refreshSession(): PrismaClient["refreshSession"] {
    return this.prisma.refreshSession;
  }

  async ping(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`;
  }

  async onApplicationShutdown(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
