import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";

test("HTTP agent isolation and role boundaries", { skip: !process.env.TEST_DATABASE_URL }, async () => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.NODE_ENV = "test";
  process.env.JWT_ACCESS_SECRET ??= "integration-test-access-secret-at-least-32-chars";
  process.env.JWT_ACCESS_TTL ??= "15m";
  process.env.REFRESH_TOKEN_TTL_DAYS ??= "1";

  const [{ NestFactory }, { AppModule }, { configureHttp }, { createPrismaClient }, argon2] = await Promise.all([
    import("@nestjs/core"),
    import("../../src/app.module.js"),
    import("../../src/bootstrap.js"),
    import("../../src/database/prisma-client.js"),
    import("argon2"),
  ]);
  const prisma = createPrismaClient(process.env.DATABASE_URL!);
  const app = await NestFactory.create(AppModule, { logger: false });
  configureHttp(app, "test");
  await app.listen(0, "127.0.0.1");
  const address = app.getHttpServer().address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}/api/v1`;
  const marker = randomUUID();
  const password = `TestPassword-${marker}`;
  const createdUserIds: string[] = [];

  async function request(path: string, method: string, token?: string, body?: unknown) {
    return fetch(base + path, {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  }

  try {
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const users = await Promise.all(["a", "b", "admin"].map((suffix) => prisma.user.create({
      data: {
        email: `${marker}-${suffix}@example.test`,
        name: suffix,
        passwordHash,
        role: suffix === "admin" ? "PLATFORM_ADMIN" : "AGENT",
        status: "ACTIVE",
      },
    })));
    createdUserIds.push(...users.map((user) => user.id));
    const tokens = await Promise.all(users.map(async (user) => {
      const response = await request("/auth/login", "POST", undefined, { email: user.email, password });
      assert.equal(response.status, 201);
      return (await response.json()).accessToken as string;
    }));
    const [agentA, agentB, admin] = tokens;
    assert.ok(agentA && agentB && admin);

    const created = await request("/clients", "POST", agentB, { name: "Private client" });
    assert.equal(created.status, 201);
    const client = await created.json() as { id: string };

    assert.equal((await request(`/clients/${client.id}`, "GET", agentA)).status, 404);
    assert.equal((await request(`/clients/${client.id}`, "PATCH", agentA, { name: "Stolen" })).status, 404);
    assert.equal((await request(`/clients/${client.id}`, "DELETE", agentA)).status, 404);
    const list = await request("/clients", "GET", agentA);
    assert.equal(list.status, 200);
    assert.equal((await list.json()).items.length, 0);
    assert.equal((await request("/clients", "POST", agentA, { name: "Bad", agentId: users[1]?.id })).status, 400);
    assert.equal((await request("/properties", "POST", agentA, {
      title: "Foreign owner", propertyType: "HOUSE", transactionType: "SALE", ownerClientId: client.id,
    })).status, 404);
    const propertyResponse = await request("/properties", "POST", agentB, {
      title: "Private property", propertyType: "HOUSE", transactionType: "SALE", ownerClientId: client.id,
    });
    assert.equal(propertyResponse.status, 201);
    const property = await propertyResponse.json() as { id: string };
    assert.equal((await request("/visits", "POST", agentA, {
      clientId: client.id, propertyId: property.id, visitedAt: "2026-10-20T10:00:00+05:45",
    })).status, 404);
    assert.equal((await request("/deals", "POST", agentA, {
      clientId: client.id, propertyId: property.id,
    })).status, 404);
    assert.equal((await request("/admin/agents", "GET", agentA)).status, 403);
    assert.equal((await request("/clients", "GET", admin)).status, 403);
  } finally {
    await prisma.refreshSession.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.deal.deleteMany({ where: { agentId: { in: createdUserIds } } });
    await prisma.visit.deleteMany({ where: { agentId: { in: createdUserIds } } });
    await prisma.activity.deleteMany({ where: { agentId: { in: createdUserIds } } });
    await prisma.buyerRequirement.deleteMany({ where: { agentId: { in: createdUserIds } } });
    await prisma.property.deleteMany({ where: { agentId: { in: createdUserIds } } });
    await prisma.client.deleteMany({ where: { agentId: { in: createdUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await app.close();
    await prisma.$disconnect();
  }
});
