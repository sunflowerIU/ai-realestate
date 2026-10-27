import { z } from "zod";

export const propertyTypeSchema = z.enum(["HOUSE", "APARTMENT", "LAND", "COMMERCIAL", "OTHER"]);
export const transactionTypeSchema = z.enum(["SALE", "RENT"]);
export const decimalSchema = z.string().regex(/^(?:0|[1-9]\d{0,17})(?:\.\d{1,6})?$/);
export const metersSchema = z.string().regex(/^(?:0|[1-9]\d{0,5})(?:\.\d{1,2})?$/);
export const wholeNprSchema = z.string().regex(/^(?:0|[1-9]\d{0,17})$/).refine(
  (value) => BigInt(value) <= 9_223_372_036_854_775_807n,
  "Value exceeds database range",
);
