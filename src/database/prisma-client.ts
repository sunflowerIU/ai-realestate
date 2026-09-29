import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

export function createPrismaClient(databaseUrl: string): PrismaClient {
  const adapter = new PrismaPg({ connectionString: databaseUrl });
  return new PrismaClient({ adapter });
}

export { PrismaClient, Prisma } from "../generated/prisma/client.js";
export type { User, RefreshSession } from "../generated/prisma/client.js";
