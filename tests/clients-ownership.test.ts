import assert from "node:assert/strict";
import { test } from "node:test";
import { ClientsRepository } from "../src/modules/clients/clients.repository.js";
import { ClientsService } from "../src/modules/clients/clients.service.js";
import { createClientSchema, listClientsSchema } from "../src/modules/clients/clients.schema.js";
import type { DatabaseService } from "../src/database/database.service.js";

type Row = { id: string; agentId: string; name: string; status: "ACTIVE" | "INACTIVE" };

function setup() {
  const rows: Row[] = [
    { id: "owned-a", agentId: "agent-a", name: "Ram", status: "ACTIVE" },
    { id: "owned-b", agentId: "agent-b", name: "Sita", status: "ACTIVE" },
  ];
  const calls: Array<{ operation: string; where?: { id?: string; agentId?: string } }> = [];
  const client = {
    create: async ({ data }: { data: Row }) => {
      rows.push({ id: "new", ...data });
      return rows.at(-1);
    },
    findFirst: async ({ where }: { where: { id: string; agentId: string } }) => {
      calls.push({ operation: "findFirst", where });
      return rows.find((row) => row.id === where.id && row.agentId === where.agentId) ?? null;
    },
    findMany: async ({ where }: { where: { agentId: string } }) => {
      calls.push({ operation: "findMany", where });
      return rows.filter((row) => row.agentId === where.agentId);
    },
    count: async ({ where }: { where: { agentId: string } }) => {
      calls.push({ operation: "count", where });
      return rows.filter((row) => row.agentId === where.agentId).length;
    },
    updateMany: async ({ where, data }: { where: { id: string; agentId: string }; data: Partial<Row> }) => {
      calls.push({ operation: "updateMany", where });
      const row = rows.find((candidate) => candidate.id === where.id && candidate.agentId === where.agentId);
      if (!row) return { count: 0 };
      Object.assign(row, data);
      return { count: 1 };
    },
    deleteMany: async ({ where }: { where: { id: string; agentId: string } }) => {
      calls.push({ operation: "deleteMany", where });
      const index = rows.findIndex((row) => row.id === where.id && row.agentId === where.agentId);
      if (index < 0) return { count: 0 };
      rows.splice(index, 1);
      return { count: 1 };
    },
  };
  const repo = new ClientsRepository({ client } as unknown as DatabaseService);
  return { service: new ClientsService(repo), rows, calls };
}

test("agent cannot read, update, delete, or list another agent's client", async () => {
  const { service, rows, calls } = setup();
  await assert.rejects(service.get("agent-a", "owned-b"), { statusCode: 404 });
  await assert.rejects(service.update("agent-a", "owned-b", { name: "Changed" }), { statusCode: 404 });
  await assert.rejects(service.delete("agent-a", "owned-b"), { statusCode: 404 });
  const listed = await service.list("agent-a", listClientsSchema.parse({}));
  assert.deepEqual(listed.items.map((item) => item.id), ["owned-a"]);
  assert.equal(rows.find((row) => row.id === "owned-b")?.name, "Sita");
  assert.ok(calls.every((call) => call.where?.agentId === "agent-a"));
});

test("creation rejects supplied ownership and uses authenticated agent", async () => {
  assert.equal(createClientSchema.safeParse({ name: "Ram", agentId: "agent-b" }).success, false);
  const { service, rows } = setup();
  await service.create("agent-a", createClientSchema.parse({ name: "New" }));
  assert.equal(rows.at(-1)?.agentId, "agent-a");
});
