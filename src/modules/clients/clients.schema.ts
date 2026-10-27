import { z } from "zod";
import { paginationQuerySchema } from "../../common/pagination/pagination.schema.js";
import { uuidSchema } from "../../common/pipes/uuid.schema.js";

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();

export const clientIdSchema = uuidSchema;

export const createClientSchema = z.object({
  name: z.string().trim().min(1).max(150),
  phone: optionalText(40),
  alternatePhone: optionalText(40),
  email: z.email().max(320).nullable().optional(),
  address: optionalText(500),
  notes: optionalText(5000),
  source: optionalText(100),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
}).strict();

export const updateClientSchema = createClientSchema.partial().refine(
  (input) => Object.keys(input).length > 0,
  "At least one field is required",
);

export const listClientsSchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).max(100).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  sort: z.enum(["newest", "oldest", "name_asc", "name_desc"]).default("newest"),
}).strict();

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type ListClientsInput = z.infer<typeof listClientsSchema>;
