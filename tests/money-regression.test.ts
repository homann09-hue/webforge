import { describe, expect, it } from "vitest";
import { MAX_CENTS, MAX_QUANTITY, isBookableLine, parseDecimalInput, parsePercent, parseQuantity } from "@/lib/money";

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
    // "7,5%" was listed here originally, which locked in the wrong answer:
    // a percent sign in a percent field is not unreadable input. See the
    // "Regression 2" block below.
    expect(parsePercent("abc", 19)).toBeNull();
    expect(parsePercent("7,5,5", 19)).toBeNull();
    expect(parsePercent("1.2.3", 19)).toBeNull();
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

/**
 * Second review round: cases the strict rewrite refused that people
 * legitimately type, and the percent sign it still could not read.
 */
describe("Regression 2: legitimate input must not be refused", () => {
  it("accepts a trailing separator (typed, then tabbed away)", () => {
    expect(parseDecimalInput("1249,")).toBe(1249);
    expect(parseDecimalInput("5,")).toBe(5);
    expect(parseDecimalInput("1.")).toBe(1);
  });

  it("accepts a leading separator", () => {
    expect(parseDecimalInput(",5")).toBe(0.5);
    expect(parseDecimalInput(".5")).toBe(0.5);
  });

  it("still rejects a bare separator", () => {
    expect(parseDecimalInput(",")).toBeNull();
    expect(parseDecimalInput(".")).toBeNull();
  });

  it("reads a percentage written with its sign", () => {
    expect(parsePercent("7,5%", 19)).toBe(7.5);
    expect(parsePercent("19 %", 19)).toBe(19);
    expect(parsePercent("0%", 19)).toBe(0);
  });

  it("does not let the percent sign smuggle nonsense through", () => {
    expect(parsePercent("%%", 19)).toBeNull();
    expect(parsePercent("7,5%%", 19)).toBeNull();
    expect(parsePercent("abc%", 19)).toBeNull();
  });
});

/**
 * Third review round. The server-side bound capped the quantity only, so the
 * overflow its own comment cited was still reachable.
 */
describe("Regression 3: line items must be bounded by their product", () => {
  it("accepts an ordinary line", () => {
    expect(isBookableLine(1, 69900)).toBe(true);
    expect(isBookableLine(2.5, 9900)).toBe(true);
  });

  it("refuses the exact overflow the quantity cap missed", () => {
    // Both factors pass their individual checks; the product does not.
    expect(MAX_QUANTITY).toBe(1_000_000);
    expect(Number.isSafeInteger(10_000_000_000)).toBe(true);
    expect(isBookableLine(1_000_000, 10_000_000_000)).toBe(false);
  });

  it("refuses a price beyond the cent ceiling", () => {
    expect(isBookableLine(1, MAX_CENTS + 1)).toBe(false);
    expect(isBookableLine(1, MAX_CENTS)).toBe(true);
  });

  it("refuses zero, negative and non-finite quantities", () => {
    for (const q of [0, -1, Number.NaN, Number.POSITIVE_INFINITY, MAX_QUANTITY + 1]) {
      expect(isBookableLine(q, 100)).toBe(false);
    }
  });

  it("refuses a fractional or negative price", () => {
    expect(isBookableLine(1, 10.5)).toBe(false);
    expect(isBookableLine(1, -1)).toBe(false);
  });
});
