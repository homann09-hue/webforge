import { describe, expect, it } from "vitest";
import { parseDecimalInput, parsePercent, parseQuantity } from "@/lib/money";

/**
 * Cases from the independent review of this branch. Each one is a value the
 * parser returned WRONG rather than rejecting — worse than the NaN-to-zero bug
 * it replaced, because a plausible-looking number does not draw attention.
 */
describe("Regression: unreadable input must be rejected, not guessed", () => {
  it("does not read '1.234.56' as 123456 (100x too large)", () => {
    expect(parseDecimalInput("1.234.56")).toBeNull();
  });

  it("does not read '12.345.67' as 1234567", () => {
    expect(parseDecimalInput("12.345.67")).toBeNull();
  });

  it("rejects two decimal commas", () => {
    expect(parseDecimalInput("699,50,25")).toBeNull();
  });

  it("rejects doubled separators", () => {
    expect(parseDecimalInput("1..2")).toBeNull();
    expect(parseDecimalInput("1,,2")).toBeNull();
  });

  it("rejects '1.2.3'", () => {
    expect(parseDecimalInput("1.2.3")).toBeNull();
  });

  it("still accepts the legitimate forms", () => {
    expect(parseDecimalInput("1.234.567")).toBe(1234567);
    expect(parseDecimalInput("1.249,00")).toBe(1249);
    expect(parseDecimalInput("1,234.56")).toBe(1234.56);
    expect(parseDecimalInput("699,50")).toBe(699.5);
    expect(parseDecimalInput("699")).toBe(699);
  });
});

describe("Regression: parsePercent must distinguish empty from unreadable", () => {
  it("uses the fallback only for an empty field", () => {
    expect(parsePercent("", 19)).toBe(19);
    expect(parsePercent("   ", 19)).toBe(19);
  });

  it("rejects unreadable input instead of silently booking the fallback", () => {
    expect(parsePercent("7,5%", 19)).toBeNull();
    expect(parsePercent("abc", 19)).toBeNull();
  });

  it("still reads a plain percentage", () => {
    expect(parsePercent("7,5", 19)).toBe(7.5);
    expect(parsePercent("0", 19)).toBe(0);
  });
});

describe("Regression: parseQuantity needs an upper bound", () => {
  it("rejects an absurd quantity", () => {
    expect(parseQuantity("999999999999999999999")).toBeNull();
  });

  it("still accepts realistic quantities", () => {
    expect(parseQuantity("1")).toBe(1);
    expect(parseQuantity("1,5")).toBe(1.5);
    expect(parseQuantity("1000")).toBe(1000);
  });
});
