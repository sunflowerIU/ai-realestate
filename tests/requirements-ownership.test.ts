import assert from "node:assert/strict";
import { test } from "node:test";
import { RequirementsRepository } from "../src/modules/requirements/requirements.repository.js";
import { RequirementsService } from "../src/modules/requirements/requirements.service.js";
import { createRequirementSchema, listRequirementsSchema } from "../src/modules/requirements/requirements.schema.js";
import type { DatabaseService } from "../src/database/database.service.js";
import type { ClientsService } from "../src/modules/clients/clients.service.js";

test("requirement repository scopes read, update, and list", async () => {
  const scopes: string[] = [];
  const buyerRequirement = {
    findFirst: async ({ where }: { where: { agentId: string } }) => { scopes.push(where.agentId); return null; },
    update: async ({ where }: { where: { id_agentId: { agentId: string } } }) => { scopes.push(where.id_agentId.agentId); return {}; },
    findMany: async ({ where }: { where: { agentId: string } }) => { scopes.push(where.agentId); return []; },
    count: async ({ where }: { where: { agentId: string } }) => { scopes.push(where.agentId); return 0; },
  };
  const repository = new RequirementsRepository({ buyerRequirement } as unknown as DatabaseService);
  await repository.findOne("agent-a", "requirement-b");
  await repository.update("agent-a", "requirement-b", { title: "Changed" });
  await repository.list("agent-a", listRequirementsSchema.parse({}), 0, 20);
  assert.deepEqual(scopes, ["agent-a", "agent-a", "agent-a", "agent-a"]);
});

test("requirement cannot attach to another agent's client", async () => {
  assert.equal(createRequirementSchema.safeParse({ clientId: "00000000-0000-4000-8000-000000000001", propertyType: "HOUSE", transactionType: "SALE", agentId: "agent-b" }).success, false);
  let created = false;
  const repository = { create: async () => { created = true; } } as unknown as RequirementsRepository;
  const clients = { get: async () => { throw Object.assign(new Error("Client not found"), { statusCode: 404 }); } } as unknown as ClientsService;
  const service = new RequirementsService(repository, clients);
  const input = createRequirementSchema.parse({ clientId: "00000000-0000-4000-8000-000000000001", buyerEmail: "buyer@example.com", buyerPhoneNo: "9812345678", propertyType: "HOUSE", transactionType: "SALE" });
  await assert.rejects(service.create("agent-a", input), { statusCode: 404 });
  assert.equal(created, false);
});

test("requirement creation nests preferred areas and returns them", async () => {
  let createdData: Record<string, unknown> | undefined;
  const repository = {
    create: async (data: Record<string, unknown>) => {
      createdData = data;
      return { ...data, id: "requirement-a", preferredLocations: [{ id: "area-a", province: "Bagmati", district: "Kathmandu", municipality: "Kathmandu Metropolitan City", localities: ["Baneshwor"] }] };
    },
  } as unknown as RequirementsRepository;
  const service = new RequirementsService(repository, {} as ClientsService);
  const input = createRequirementSchema.parse({
    buyerEmail: "buyer@example.com",
    buyerPhoneNo: "9812345678",
    propertyType: "LAND",
    transactionType: "SALE",
    preferredLocations: [{ province: "Bagmati", district: "Kathmandu", municipality: "Kathmandu Metropolitan City", localities: ["Baneshwor"] }],
  });
  const created = await service.create("agent-a", input);
  assert.deepEqual(createdData?.preferredLocations, { create: input.preferredLocations });
  assert.deepEqual(created.preferredLocations, [{ id: "area-a", ...input.preferredLocations[0] }]);
});

test("requirement update replaces preferred areas in one nested write", async () => {
  let updateData: Record<string, unknown> | undefined;
  const repository = {
    findOne: async () => ({ id: "requirement-a", minBudgetNpr: null, maxBudgetNpr: null, minLandAreaSqMm: null, maxLandAreaSqMm: null }),
    update: async (_agentId: string, _id: string, data: Record<string, unknown>) => {
      updateData = data;
      return { id: "requirement-a", preferredLocations: [] };
    },
  } as unknown as RequirementsRepository;
  const service = new RequirementsService(repository, {} as ClientsService);
  await service.update("agent-a", "requirement-a", {
    preferredLocations: [{ province: "Bagmati", district: "Makwanpur", municipality: "Hetauda Sub-Metropolitan City", localities: ["Shantinagar"] }],
  });
  assert.deepEqual(updateData?.preferredLocations, {
    deleteMany: {},
    create: [{ province: "Bagmati", district: "Makwanpur", municipality: "Hetauda Sub-Metropolitan City", localities: ["Shantinagar"] }],
  });
});

test("requirement search chooses location or buyer and client names", async () => {
  const filters: Record<string, unknown>[] = [];
  const db = {
    queryRaw: async () => [{ id: "locality-match" }],
    buyerRequirement: {
      findMany: async ({ where }: { where: Record<string, unknown> }) => { filters.push(where); return []; },
      count: async () => 0,
    },
  } as unknown as DatabaseService;
  const repository = new RequirementsRepository(db);
  await repository.list("agent-a", listRequirementsSchema.parse({ search: "Shanti", searchBy: "location" }), 0, 20);
  await repository.list("agent-a", listRequirementsSchema.parse({ search: "Maya", searchBy: "client" }), 0, 20);
  assert.equal(filters[0]?.agentId, "agent-a");
  assert.deepEqual(filters[0]?.AND, [{ OR: [
    { preferredLocations: { some: { province: { contains: "Shanti", mode: "insensitive" } } } },
    { preferredLocations: { some: { district: { contains: "Shanti", mode: "insensitive" } } } },
    { preferredLocations: { some: { municipality: { contains: "Shanti", mode: "insensitive" } } } },
    { id: { in: ["locality-match"] } },
  ] }]);
  assert.deepEqual(filters[1]?.AND, [{ OR: [
    { buyerName: { contains: "Maya", mode: "insensitive" } },
    { client: { is: { name: { contains: "Maya", mode: "insensitive" } } } },
  ] }]);
});
