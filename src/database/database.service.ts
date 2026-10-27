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

  get client(): PrismaClient["client"] {
    return this.prisma.client;
  }

  get property(): PrismaClient["property"] {
    return this.prisma.property;
  }

  get buyerRequirement(): PrismaClient["buyerRequirement"] {
    return this.prisma.buyerRequirement;
  }

  get activity(): PrismaClient["activity"] {
    return this.prisma.activity;
  }

  get visit(): PrismaClient["visit"] {
    return this.prisma.visit;
  }

  get deal(): PrismaClient["deal"] {
    return this.prisma.deal;
  }

  get transaction(): PrismaClient["$transaction"] {
    return this.prisma.$transaction.bind(this.prisma);
  }

  async ping(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`;
  }

  async onApplicationShutdown(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
