import { config } from "dotenv";
import { resolve } from "node:path";
import argon2 from "argon2";

import { createPrismaClient } from "../database/prisma-client.js";

config({
  path: resolve(process.cwd(), ".env"),
});

const databaseUrl = process.env.DATABASE_URL!;
const email = process.env.PLATFORM_ADMIN_EMAIL!;
const password = process.env.PLATFORM_ADMIN_PASSWORD!;
const name = process.env.PLATFORM_ADMIN_NAME!;

if (!databaseUrl || !email || !password || !name) {
  throw new Error(
    "Missing PLATFORM_ADMIN_NAME, PLATFORM_ADMIN_EMAIL, PLATFORM_ADMIN_PASSWORD or DATABASE_URL",
  );
}

const prisma = createPrismaClient(databaseUrl);

async function main() {
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (existing) {
    console.log("Admin/user already exists");
    return;
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
  });

  await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      passwordHash,
      role: "PLATFORM_ADMIN",
      status: "ACTIVE",
    },
  });

  console.log("Platform admin created");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
