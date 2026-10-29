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

const decimal = decimalSchema;
const wholeNpr = wholeNprSchema;
const text = (max: number) => z.string().trim().min(1).max(max);
const nullableText = (max: number) => text(max).nullable().optional();

const propertyType = propertyTypeSchema;
const transactionType = transactionTypeSchema;
const propertyStatus = z.enum([
  "ACTIVE",
  "UNDER_NEGOTIATION",
  "RESERVED",
  "SOLD",
  "RENTED",
  "WITHDRAWN",
  "ARCHIVED",
]);
const facingTypes = z.enum([
  "NORTH",
  "NORTH_EAST",
  "EAST",
  "SOUTH_EAST",
  "SOUTH",
  "SOUTH_WEST",
  "WEST",
  "NORTH_WEST",
]);
const areaUnit = z.enum([
  "ROPANI",
  "AANA",
  "PAISA",
  "DAAM",
  "BIGHA",
  "KATTHA",
  "DHUR",
  "SQ_FT",
  "SQ_M",
]);
const landArea = z.object({ value: decimal, unit: areaUnit }).strict();
function compareDecimals(left: string, right: string): number {
  const [leftWhole = "0", leftFraction = ""] = left.split(".");
  const [rightWhole = "0", rightFraction = ""] = right.split(".");
  const scale = Math.max(leftFraction.length, rightFraction.length);
  const leftValue = BigInt(leftWhole + leftFraction.padEnd(scale, "0"));
  const rightValue = BigInt(rightWhole + rightFraction.padEnd(scale, "0"));
  return leftValue < rightValue ? -1 : leftValue > rightValue ? 1 : 0;
}

export const createPropertySchema = z
  .object({
    code: nullableText(50),
    title: text(200),
    propertyType,
    transactionType,
    status: propertyStatus.optional(),
    ownerClientId: uuidSchema.nullable().optional(),
    clientName: nullableText(50),
    province: nullableText(100),
    district: nullableText(100),
    municipality: nullableText(100),
    locality: nullableText(150),
    priceNpr: wholeNpr.nullable().optional(),
    landArea: landArea.nullable().optional(),
    builtUpAreaSqM: decimal.nullable().optional(),
    bedrooms: z.number().int().min(0).max(100).nullable().optional(),
    bathrooms: z.number().int().min(0).max(100).nullable().optional(),
    roadAccessMeters: metersSchema.nullable().optional(),
    facing: facingTypes.optional(),
    description: nullableText(10000),
    remarks: nullableText(5000),
    latitude: z
      .number()
      .min(-90, { message: "Latitude must be between -90 and 90 degrees" })
      .max(90, { message: "Latitude must be between -90 and 90 degrees" }),

    longitude: z
      .number()
      .min(-180, { message: "Longitude must be between -180 and 180 degrees" })
      .max(180, { message: "Longitude must be between -180 and 180 degrees" }),
  })
  .strict()
  .superRefine((data, ctx) => {
    const hasClientId = !!data.ownerClientId;
    const hasClientName = !!data.clientName;

    if (!hasClientId && !hasClientName) {
      ctx.addIssue({
        code: "custom",
        message: "Either select a client or enter a client name.",
        path: ["clientName"],
      });
    }
  });

export const updatePropertySchema = createPropertySchema
  .partial()
  .refine(
    (input) => Object.keys(input).length > 0,
    "At least one field is required",
  );

export const listPropertiesSchema = paginationQuerySchema
  .extend({
    search: text(100).optional(),
    location: text(100).optional(),
    propertyType: propertyType.optional(),
    transactionType: transactionType.optional(),
    status: propertyStatus.optional(),
    minPriceNpr: wholeNpr.optional(),
    maxPriceNpr: wholeNpr.optional(),
    minLandAreaSqM: decimal.optional(),
    maxLandAreaSqM: decimal.optional(),
    minBedrooms: z.coerce.number().int().min(0).max(100).optional(),
    minRoadAccessMeters: metersSchema.optional(),
    ownerClientId: uuidSchema.optional(),
    sort: z
      .enum(["newest", "oldest", "price_asc", "price_desc"])
      .default("newest"),
  })
  .strict()
  .refine(
    (input) =>
      input.minPriceNpr === undefined ||
      input.maxPriceNpr === undefined ||
      BigInt(input.minPriceNpr) <= BigInt(input.maxPriceNpr),
    "Minimum price must not exceed maximum price",
  )
  .refine(
    (input) =>
      input.minLandAreaSqM === undefined ||
      input.maxLandAreaSqM === undefined ||
      compareDecimals(input.minLandAreaSqM, input.maxLandAreaSqM) <= 0,
    "Minimum land area must not exceed maximum land area",
  );

export const listArchivedPropertiesSchema = listPropertiesSchema.safeExtend({
  status: z.literal("ARCHIVED").optional(),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type ListPropertiesInput = z.infer<typeof listPropertiesSchema>;
export type ListArchivedPropertiesInput = z.infer<
  typeof listArchivedPropertiesSchema
>;
