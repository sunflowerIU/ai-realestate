import { z } from "zod";
import { paginationQuerySchema } from "../../common/pagination/pagination.schema.js";
import { uuidSchema } from "../../common/pipes/uuid.schema.js";

const timestamp = z.iso.datetime({ offset: true });
const activityType = z.enum(["NOTE", "CALL", "MEETING", "FOLLOW_UP", "EMAIL", "MESSAGE"]);

export const createActivitySchema = z.object({
  type: activityType,
  notes: z.string().trim().min(1).max(5000),
  occurredAt: timestamp,
  followUpAt: timestamp.nullable().optional(),
  clientId: uuidSchema.nullable().optional(),
  propertyId: uuidSchema.nullable().optional(),
  requirementId: uuidSchema.nullable().optional(),
}).strict();

export const updateActivitySchema = createActivitySchema.partial().refine(
  (input) => Object.keys(input).length > 0,
  "At least one field is required",
);

export const listActivitiesSchema = paginationQuerySchema.extend({
  type: activityType.optional(),
  clientId: uuidSchema.optional(),
  propertyId: uuidSchema.optional(),
  requirementId: uuidSchema.optional(),
  from: timestamp.optional(),
  to: timestamp.optional(),
  followUpsOnly: z.enum(["true", "false"]).optional(),
  sort: z.enum(["newest", "oldest"]).default("newest"),
}).strict().refine(
  (input) => !input.from || !input.to || input.from <= input.to,
  "From must not exceed to",
);

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
export type ListActivitiesInput = z.infer<typeof listActivitiesSchema>;
