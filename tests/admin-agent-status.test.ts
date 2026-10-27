import assert from "node:assert/strict";
import { test } from "node:test";
import { UsersRepository } from "../src/modules/users/users.repository.js";
import type { DatabaseService } from "../src/database/database.service.js";

test("suspension and session revocation share one transaction", async () => {
  const operations: string[] = [];
  const tx = {
    user: {
      updateMany: async ({ where, data }: { where: { id: string; role: string }; data: { status: string } }) => {
        operations.push(`status:${where.id}:${where.role}:${data.status}`);
        return { count: 1 };
      },
      findUniqueOrThrow: async () => ({ id: "agent-a", status: "SUSPENDED" }),
    },
    refreshSession: {
      updateMany: async ({ where }: { where: { userId: string } }) => {
        operations.push(`revoke:${where.userId}`);
        return { count: 2 };
      },
    },
  };
  const db = { transaction: async (fn: (transaction: typeof tx) => Promise<unknown>) => fn(tx) } as unknown as DatabaseService;
  const repository = new UsersRepository(db);
  await repository.setAgentStatus("agent-a", "SUSPENDED");
  assert.deepEqual(operations, ["status:agent-a:AGENT:SUSPENDED", "revoke:agent-a"]);
});
