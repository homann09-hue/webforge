import { describe, expect, it } from "vitest";
import {
  documentTotals,
  formatMoney,
  lineTotalCents,
  parseAmountToCents,
  parseDecimalInput,
  parsePercent,
  parseQuantity,
} from "@/lib/money";

describe("parseDecimalInput", () => {
  it("reads plain integers", () => {
    expect(parseDecimalInput("699")).toBe(699);
  });

  it("reads a German decimal comma", () => {
    expect(parseDecimalInput("699,50")).toBe(699.5);
  });

  it("reads a German thousands separator", () => {
    // This is the case the old Number(v.replace(",", ".")) turned into NaN,
    // which the `|| 0` then booked as a zero-euro line.
    expect(parseDecimalInput("1.249,00")).toBe(1249);
  });

  it("reads an English decimal point", () => {
    expect(parseDecimalInput("1249.00")).toBe(1249);
  });

  it("reads several thousands separators", () => {
    expect(parseDecimalInput("1.234.567")).toBe(1234567);
  });

  it("reads an English thousands separator with a decimal point", () => {
    expect(parseDecimalInput("1,234.56")).toBe(1234.56);
  });

  it("tolerates whitespace and a euro sign", () => {
    expect(parseDecimalInput(" 1.249,00 €")).toBe(1249);
  });

  it("rejects unreadable input instead of guessing", () => {
    expect(parseDecimalInput("")).toBeNull();
    expect(parseDecimalInput("abc")).toBeNull();
    expect(parseDecimalInput("12a4")).toBeNull();
  });
});

describe("parseAmountToCents", () => {
  it("converts to whole cents", () => {
    expect(parseAmountToCents("699,50")).toBe(69950);
    expect(parseAmountToCents("1.249,00")).toBe(124900);
    expect(parseAmountToCents("0")).toBe(0);
  });

  it("rounds half a cent up", () => {
    expect(parseAmountToCents("0,005")).toBe(1);
  });

  it("rejects negative and unreadable amounts", () => {
    expect(parseAmountToCents("-5")).toBeNull();
    expect(parseAmountToCents("")).toBeNull();
  });

  it("rejects implausibly large amounts rather than overflowing", () => {
    expect(parseAmountToCents("999999999999")).toBeNull();
  });
});

describe("parseQuantity", () => {
  it("accepts fractional quantities", () => {
    expect(parseQuantity("1,5")).toBe(1.5);
  });

  it("rejects zero and negative quantities", () => {
    expect(parseQuantity("0")).toBeNull();
    expect(parseQuantity("-1")).toBeNull();
  });
});

describe("parsePercent", () => {
  it("accepts a valid percentage", () => {
    expect(parsePercent("19")).toBe(19);
    expect(parsePercent("7,5")).toBe(7.5);
  });

  it("falls back when the field is empty", () => {
    expect(parsePercent("", 19)).toBe(19);
  });

  it("rejects values outside 0..100", () => {
    expect(parsePercent("101")).toBeNull();
    expect(parsePercent("-1")).toBeNull();
  });
});

describe("documentTotals", () => {
  it("computes a plain net/tax/gross", () => {
    const totals = documentTotals([69900], { taxPercent: 19 });
    expect(totals.netCents).toBe(69900);
    expect(totals.taxCents).toBe(13281);
    expect(totals.grossCents).toBe(83181);
  });

  it("applies the discount before tax", () => {
    const totals = documentTotals([100000], { discountPercent: 10, taxPercent: 19 });
    expect(totals.discountCents).toBe(10000);
    expect(totals.netCents).toBe(90000);
    expect(totals.taxCents).toBe(17100);
    expect(totals.grossCents).toBe(107100);
  });

  it("sums several lines", () => {
    const lines = [lineTotalCents(2, 34950), lineTotalCents(1, 9900)];
    expect(lines).toEqual([69900, 9900]);
    expect(documentTotals(lines).subtotalCents).toBe(79800);
  });

  it("never produces fractional cents", () => {
    const totals = documentTotals([3333, 3333, 3333], { discountPercent: 7.5, taxPercent: 19 });
    for (const value of Object.values(totals)) expect(Number.isInteger(value)).toBe(true);
  });
});

describe("formatMoney", () => {
  it("formats as German euro", () => {
    // Intl uses a narrow no-break space before the currency symbol.
    expect(formatMoney(124900).replace(/[\u00a0\u202f]/g, " ")).toBe("1.249,00 €");
  });
});
