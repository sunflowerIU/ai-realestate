// src/modules/admin/agents/schemas/list-agents.schema.ts
import { z } from "zod";

import { paginationQuerySchema } from "../../../../common/pagination/pagination.schema.js";

export const listAgentsSchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).max(100).optional(),
});

export type ListAgentsInput = z.infer<typeof listAgentsSchema>;
