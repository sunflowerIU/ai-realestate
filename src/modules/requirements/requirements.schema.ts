import { z } from "zod";
import { paginationQuerySchema } from "../../common/pagination/pagination.schema.js";
import { uuidSchema } from "../../common/pipes/uuid.schema.js";
import {
  decimalSchema,
  metersSchema,
  propertyTypeSchema,
  transactionTypeSchema,
  wholeNprSchema,
} from "../../common/real-estate.schema.js";

const status = z.enum(["ACTIVE", "PAUSED", "CLOSED"]);
const location = z.string().trim().min(1).max(100);
const placeName = z.string().trim().min(1).max(100);

const preferredLocationSchema = z
  .object({
    province: placeName,
    district: placeName,
    municipality: placeName,
    localities: z.array(placeName).max(20).default([]),
  })
  .strict();

export const createRequirementSchema = z
  .object({
    clientId: uuidSchema.nullable().optional(),
    buyerName: z.string().max(50).optional(),
    buyerEmail: z.email(),
    buyerPhoneNo: z.string().min(1).max(10, "Phone number must be 10 digits"),
    title: z.string().trim().min(1).max(200).nullable().optional(),
    transactionType: transactionTypeSchema,
    propertyType: propertyTypeSchema,
    preferredLocations: z.array(preferredLocationSchema).max(20).default([]),
    minBudgetNpr: wholeNprSchema.nullable().optional(),
    maxBudgetNpr: wholeNprSchema.nullable().optional(),
    minLandAreaSqM: decimalSchema.nullable().optional(),
    maxLandAreaSqM: decimalSchema.nullable().optional(),
    minBedrooms: z.number().int().min(0).max(100).nullable().optional(),
    minRoadAccessMeters: metersSchema.nullable().optional(),
    notes: z.string().trim().max(5000).nullable().optional(),
    status: status.optional(),
  })
  .strict();

export const updateRequirementSchema = createRequirementSchema
  .omit({ preferredLocations: true, clientId: true })
  .partial()
  .extend({
    preferredLocations: z.array(preferredLocationSchema).max(20).optional(),
  })
  .refine(
    (input) => Object.keys(input).length > 0,
    "At least one field is required",
  );

export const listRequirementsSchema = paginationQuerySchema
  .extend({
    clientId: uuidSchema.optional(),
    status: status.optional(),
    propertyType: propertyTypeSchema.optional(),
    transactionType: transactionTypeSchema.optional(),
    location: location.optional(),
    budgetAtLeastNpr: wholeNprSchema.optional(),
    budgetAtMostNpr: wholeNprSchema.optional(),
    search: z.string().trim().min(1).max(100).optional(),
    searchBy: z.enum(["details", "location", "client"]).default("details"),
    sort: z.enum(["newest", "oldest"]).default("newest"),
  })
  .strict();

export type CreateRequirementInput = z.infer<typeof createRequirementSchema>;
export type UpdateRequirementInput = z.infer<typeof updateRequirementSchema>;
export type ListRequirementsInput = z.infer<typeof listRequirementsSchema>;
