import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { z } from "zod";
import { createPrismaClient } from "./database/prisma-client.js";

loadEnv({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

const workerEnvironmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  DATABASE_URL: z.string().url().refine(
    (value) => value.startsWith("postgresql://") || value.startsWith("postgres://"),
    "DATABASE_URL must be a PostgreSQL URL",
  ),
});

const environment = workerEnvironmentSchema.parse(process.env);
const database = createPrismaClient(environment.DATABASE_URL);
const keepAlive = setInterval(() => undefined, 60 * 60 * 1_000);
let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  clearInterval(keepAlive);
  console.info({ signal }, "Worker shutting down");
  await database.$disconnect();
  process.exit(0);
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

console.info({ environment: environment.NODE_ENV }, "Worker shell started");
