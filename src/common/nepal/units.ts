export type MoneyUnit = "NPR" | "LAKH" | "CRORE";
export type LandAreaUnit = "ROPANI" | "AANA" | "PAISA" | "DAAM" | "BIGHA" | "KATTHA" | "DHUR" | "SQ_FT" | "SQ_M";

function decimalParts(value: string): { numerator: bigint; denominator: bigint } {
  if (!/^(?:0|[1-9]\d{0,17})(?:\.\d{1,6})?$/.test(value)) {
    throw new RangeError("Expected a non-negative decimal with at most six fractional digits");
  }
  const [whole = "0", fraction = ""] = value.split(".");
  const denominator = 10n ** BigInt(fraction.length);
  return { numerator: BigInt(whole) * denominator + BigInt(fraction || "0"), denominator };
}

const nprFactor: Record<MoneyUnit, bigint> = {
  NPR: 1n,
  LAKH: 100_000n,
  CRORE: 10_000_000n,
};
const maxDatabaseBigInt = 9_223_372_036_854_775_807n;

/** Whole NPR only. The input remains a decimal string to avoid floating point loss. */
export function toNpr(value: string, unit: MoneyUnit): bigint {
  const { numerator, denominator } = decimalParts(value);
  const scaled = numerator * nprFactor[unit];
  if (scaled % denominator !== 0n) throw new RangeError("Money must resolve to whole NPR");
  const result = scaled / denominator;
  if (result > maxDatabaseBigInt) throw new RangeError("Money exceeds database range");
  return result;
}

// 1 sq ft = 92,903.04 sq mm. Nepal's customary area factors follow
// the 5,476 sq ft ropani and 72,900 sq ft bigha conventions.
const squareFootNumerator = 9_290_304n;
const squareFootDenominator = 100n;
const areaFactors: Record<LandAreaUnit, { numerator: bigint; denominator: bigint }> = {
  ROPANI: { numerator: 5476n * squareFootNumerator, denominator: squareFootDenominator },
  AANA: { numerator: 5476n * squareFootNumerator, denominator: 16n * squareFootDenominator },
  PAISA: { numerator: 5476n * squareFootNumerator, denominator: 64n * squareFootDenominator },
  DAAM: { numerator: 5476n * squareFootNumerator, denominator: 256n * squareFootDenominator },
  BIGHA: { numerator: 72_900n * squareFootNumerator, denominator: squareFootDenominator },
  KATTHA: { numerator: 72_900n * squareFootNumerator, denominator: 20n * squareFootDenominator },
  DHUR: { numerator: 72_900n * squareFootNumerator, denominator: 400n * squareFootDenominator },
  SQ_FT: { numerator: squareFootNumerator, denominator: squareFootDenominator },
  SQ_M: { numerator: 1_000_000n, denominator: 1n },
};

/** Canonical integer square millimeters, rounded to the nearest sq mm. */
export function toSquareMillimeters(value: string, unit: LandAreaUnit): bigint {
  const decimal = decimalParts(value);
  const factor = areaFactors[unit];
  const numerator = decimal.numerator * factor.numerator;
  const denominator = decimal.denominator * factor.denominator;
  const result = (numerator + denominator / 2n) / denominator;
  if (result > maxDatabaseBigInt) throw new RangeError("Area exceeds database range");
  return result;
}
