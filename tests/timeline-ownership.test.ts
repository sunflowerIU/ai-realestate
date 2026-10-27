import assert from "node:assert/strict";
import { test } from "node:test";
import { ActivitiesRepository } from "../src/modules/activities/activities.repository.js";
import { VisitsRepository } from "../src/modules/visits/visits.repository.js";
import { DealsRepository } from "../src/modules/deals/deals.repository.js";
import { VisitsService } from "../src/modules/visits/visits.service.js";
import { createVisitSchema } from "../src/modules/visits/visits.schema.js";
import type { DatabaseService } from "../src/database/database.service.js";
import type { ClientsService } from "../src/modules/clients/clients.service.js";
import type { PropertiesService } from "../src/modules/properties/properties.service.js";
import type { RequirementsService } from "../src/modules/requirements/requirements.service.js";

test("activity, visit, and deal queries enforce agent ownership", async () => {
  for (const [delegateName, Repository] of [
    ["activity", ActivitiesRepository],
    ["visit", VisitsRepository],
    ["deal", DealsRepository],
  ] as const) {
    const seen: Array<{ id?: string; agentId: string }> = [];
    const delegate = {
      findFirst: async ({ where }: { where: { id: string; agentId: string } }) => { seen.push(where); return null; },
      updateMany: async ({ where }: { where: { id: string; agentId: string } }) => { seen.push(where); return { count: 0 }; },
    };
    const repository = new Repository({ [delegateName]: delegate } as unknown as DatabaseService);
    await repository.findOne("agent-a", "foreign-id");
    await repository.update("agent-a", "foreign-id", {});
    assert.deepEqual(seen, [
      { id: "foreign-id", agentId: "agent-a" },
      { id: "foreign-id", agentId: "agent-a" },
    ]);
  }
});

test("visit cannot pair a client with another client's requirement", async () => {
  let created = false;
  const visits = { create: async () => { created = true; } } as unknown as VisitsRepository;
  const clients = { get: async () => ({ id: "client-a" }) } as unknown as ClientsService;
  const properties = { get: async () => ({ id: "property-a" }) } as unknown as PropertiesService;
  const requirements = { get: async () => ({ clientId: "client-b" }) } as unknown as RequirementsService;
  const service = new VisitsService(visits, clients, properties, requirements);
  const input = createVisitSchema.parse({
    clientId: "00000000-0000-4000-8000-000000000001",
    propertyId: "00000000-0000-4000-8000-000000000002",
    requirementId: "00000000-0000-4000-8000-000000000003",
    visitedAt: "2026-10-20T10:00:00+05:45",
  });
  await assert.rejects(service.create("agent-a", input), { statusCode: 400 });
  assert.equal(created, false);
});
