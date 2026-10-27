import assert from "node:assert/strict";
import { test } from "node:test";
import { toNpr, toSquareMillimeters } from "../src/common/nepal/units.js";

test("money converts exactly into whole NPR", () => {
  assert.equal(toNpr("1", "CRORE"), 10_000_000n);
  assert.equal(toNpr("50", "LAKH"), 5_000_000n);
  assert.equal(toNpr("1.25", "CRORE"), 12_500_000n);
  assert.throws(() => toNpr("0.1", "NPR"), RangeError);
});

test("customary land areas normalize consistently", () => {
  assert.equal(toSquareMillimeters("1", "ROPANI"), toSquareMillimeters("16", "AANA"));
  assert.equal(toSquareMillimeters("1", "AANA"), toSquareMillimeters("4", "PAISA"));
  assert.equal(toSquareMillimeters("1", "PAISA"), toSquareMillimeters("4", "DAAM"));
  assert.equal(toSquareMillimeters("1", "BIGHA"), toSquareMillimeters("20", "KATTHA"));
  assert.equal(toSquareMillimeters("1", "KATTHA"), toSquareMillimeters("20", "DHUR"));
  assert.equal(toSquareMillimeters("1", "SQ_M"), 1_000_000n);
});
