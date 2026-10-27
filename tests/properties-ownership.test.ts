import assert from "node:assert/strict";
import { test } from "node:test";
import { PropertiesRepository } from "../src/modules/properties/properties.repository.js";
import { PropertiesService } from "../src/modules/properties/properties.service.js";
import { createPropertySchema, listArchivedPropertiesSchema, listPropertiesSchema } from "../src/modules/properties/properties.schema.js";
import type { DatabaseService } from "../src/database/database.service.js";
import type { ClientsService } from "../src/modules/clients/clients.service.js";

test("property repository scopes reads, lists, and mutations to agent", async () => {
  const calls: Array<{ operation: string; where: { agentId: string; id?: string; status?: unknown } }> = [];
  const property = {
    findFirst: async ({ where }: { where: { agentId: string; id: string } }) => {
      calls.push({ operation: "findFirst", where });
      return null;
    },
    updateMany: async ({ where }: { where: { agentId: string; id: string } }) => {
      calls.push({ operation: "updateMany", where });
      return { count: 0 };
    },
    findMany: async ({ where }: { where: { agentId: string } }) => {
      calls.push({ operation: "findMany", where });
      return [];
    },
    count: async ({ where }: { where: { agentId: string } }) => {
      calls.push({ operation: "count", where });
      return 0;
    },
  };
  const repository = new PropertiesRepository({ property } as unknown as DatabaseService);
  await repository.findOne("agent-a", "property-b");
  await repository.update("agent-a", "property-b", { title: "Changed" });
  await repository.list("agent-a", listPropertiesSchema.parse({ location: "Lalitpur" }), 0, 20);
  assert.deepEqual(calls.map((call) => call.operation), ["findFirst", "updateMany", "findMany", "count"]);
  assert.ok(calls.every((call) => call.where.agentId === "agent-a"));
  assert.equal(calls[0]?.where.id, "property-b");
  assert.equal(calls[1]?.where.id, "property-b");
  assert.deepEqual(calls[2]?.where.status, { not: "ARCHIVED" });
  assert.deepEqual(calls[3]?.where.status, { not: "ARCHIVED" });
});

test("property creation rejects supplied agent and foreign owner", async () => {
  assert.equal(createPropertySchema.safeParse({ title: "House", propertyType: "HOUSE", transactionType: "SALE", agentId: "agent-b" }).success, false);
  let created = false;
  const repository = { create: async () => { created = true; } } as unknown as PropertiesRepository;
  const clients = { get: async () => { throw Object.assign(new Error("Client not found"), { statusCode: 404 }); } } as unknown as ClientsService;
  const service = new PropertiesService(repository, clients);
  const input = createPropertySchema.parse({ title: "House", propertyType: "HOUSE", transactionType: "SALE", ownerClientId: "00000000-0000-4000-8000-000000000001" });
  await assert.rejects(service.create("agent-a", input), { statusCode: 404 });
  assert.equal(created, false);
});

test("archived property list keeps search and pagination while forcing archived status", async () => {
  let received: { agentId: string; status?: string; search?: string; skip: number; take: number } | undefined;
  const repository = {
    list: async (agentId: string, input: { status?: string; search?: string }, skip: number, take: number) => {
      received = { agentId, status: input.status, search: input.search, skip, take };
      return [[], 7] as const;
    },
  } as unknown as PropertiesRepository;
  const service = new PropertiesService(repository, {} as ClientsService);
  const input = listArchivedPropertiesSchema.parse({ page: "2", pageSize: "3", search: "house" });
  const result = await service.listArchived("agent-a", input);
  assert.deepEqual(received, { agentId: "agent-a", status: "ARCHIVED", search: "house", skip: 3, take: 3 });
  assert.deepEqual(result.pagination, { page: 2, pageSize: 3, total: 7, totalPages: 3 });
  assert.equal(listArchivedPropertiesSchema.safeParse({ status: "ACTIVE" }).success, false);
});
