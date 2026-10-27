import { z } from "zod";
import { paginationQuerySchema } from "../../common/pagination/pagination.schema.js";
import { uuidSchema } from "../../common/pipes/uuid.schema.js";
import { wholeNprSchema } from "../../common/real-estate.schema.js";

const status = z.enum(["OPEN", "NEGOTIATING", "WON", "LOST", "CANCELLED"]);
const timestamp = z.iso.datetime({ offset: true });

export const createDealSchema = z.object({
  clientId: uuidSchema,
  propertyId: uuidSchema,
  requirementId: uuidSchema.nullable().optional(),
  status: status.optional(),
  agreedPriceNpr: wholeNprSchema.nullable().optional(),
  commissionNpr: wholeNprSchema.nullable().optional(),
  notes: z.string().trim().max(5000).nullable().optional(),
}).strict();

export const updateDealSchema = createDealSchema.partial().refine(
  (input) => Object.keys(input).length > 0,
  "At least one field is required",
);

export const listDealsSchema = paginationQuerySchema.extend({
  clientId: uuidSchema.optional(),
  propertyId: uuidSchema.optional(),
  requirementId: uuidSchema.optional(),
  status: status.optional(),
  from: timestamp.optional(),
  to: timestamp.optional(),
  sort: z.enum(["newest", "oldest"]).default("newest"),
}).strict().refine((input) => !input.from || !input.to || input.from <= input.to, "From must not exceed to");

export type CreateDealInput = z.infer<typeof createDealSchema>;
export type UpdateDealInput = z.infer<typeof updateDealSchema>;
export type ListDealsInput = z.infer<typeof listDealsSchema>;
