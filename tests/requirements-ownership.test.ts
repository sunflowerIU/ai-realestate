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
    updateMany: async ({ where }: { where: { agentId: string } }) => { scopes.push(where.agentId); return { count: 0 }; },
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
  const input = createRequirementSchema.parse({ clientId: "00000000-0000-4000-8000-000000000001", propertyType: "HOUSE", transactionType: "SALE" });
  await assert.rejects(service.create("agent-a", input), { statusCode: 404 });
  assert.equal(created, false);
});
