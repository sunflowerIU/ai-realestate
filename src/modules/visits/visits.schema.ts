import { z } from "zod";
import { paginationQuerySchema } from "../../common/pagination/pagination.schema.js";
import { uuidSchema } from "../../common/pipes/uuid.schema.js";

const timestamp = z.iso.datetime({ offset: true });
const status = z.enum(["PLANNED", "COMPLETED", "CANCELLED"]);

export const createVisitSchema = z.object({
  clientId: uuidSchema,
  propertyId: uuidSchema,
  requirementId: uuidSchema.nullable().optional(),
  visitedAt: timestamp,
  status: status.optional(),
  feedback: z.string().trim().max(3000).nullable().optional(),
  notes: z.string().trim().max(5000).nullable().optional(),
}).strict();

export const updateVisitSchema = createVisitSchema.partial().refine(
  (input) => Object.keys(input).length > 0,
  "At least one field is required",
);

export const listVisitsSchema = paginationQuerySchema.extend({
  clientId: uuidSchema.optional(),
  propertyId: uuidSchema.optional(),
  requirementId: uuidSchema.optional(),
  status: status.optional(),
  from: timestamp.optional(),
  to: timestamp.optional(),
  sort: z.enum(["newest", "oldest"]).default("newest"),
}).strict().refine((input) => !input.from || !input.to || input.from <= input.to, "From must not exceed to");

export type CreateVisitInput = z.infer<typeof createVisitSchema>;
export type UpdateVisitInput = z.infer<typeof updateVisitSchema>;
export type ListVisitsInput = z.infer<typeof listVisitsSchema>;
