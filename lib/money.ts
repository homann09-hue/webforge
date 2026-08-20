/**
 * Parsing and formatting of the money amounts typed into the admin UI.
 *
 * The previous inline approach was `Number(value.replace(",", "."))`, which
 * turns the perfectly ordinary German input "1.249,00" into "1.249.00", then
 * into NaN, then — via `|| 0` — into an invoice line worth nothing. Anything
 * touching cents goes through here instead.
 */

/** Amounts above this are refused rather than silently overflowing. */
const MAX_CENTS = 100_000_000_00; // 100 million euro

/** Quantities above this are refused. An invoice line is not a warehouse. */
const MAX_QUANTITY = 1_000_000;

/** Longer than this is not a number a person typed. */
const MAX_INPUT_LENGTH = 32;

/**
 * Accepted spellings. Anything not matching exactly one of these is rejected.
 *
 * An earlier version guessed: it stripped separators it did not understand and
 * returned a number anyway. That turned "1.234.56" into 123456 — a hundred
 * times too large, and far more dangerous than the NaN-to-zero bug it replaced,
 * because a wrong-looking zero gets noticed and a wrong-looking 123.456 does
 * not. Guessing is now a rejection.
 */
const GRAMMARS: Array<{ pattern: RegExp; normalise: (value: string) => string }> = [
  // 1249
  { pattern: /^-?\d+$/, normalise: (v) => v },
  // 1.234.567 — dots as thousands separators (groups of exactly three)
  { pattern: /^-?\d{1,3}(\.\d{3})+$/, normalise: (v) => v.split(".").join("") },
  // 1.234.567,89 — German full form
  { pattern: /^-?\d{1,3}(\.\d{3})+,\d+$/, normalise: (v) => v.split(".").join("").replace(",", ".") },
  // 699,50 — decimal comma. Must be tried BEFORE the English thousands form:
  // "0,005" matches both, and in a German UI it means five thousandths, not
  // five. Getting this order wrong turned 0,005 into 5.
  { pattern: /^-?\d+,\d+$/, normalise: (v) => v.replace(",", ".") },
  // 1,234,567.89 — English full form. Needs at least two comma groups or a
  // decimal point to be distinguishable from the rule above.
  { pattern: /^-?\d{1,3}(,\d{3})+(\.\d+)?$/, normalise: (v) => v.split(",").join("") },
  // 1249.00 — decimal point
  { pattern: /^-?\d+\.\d+$/, normalise: (v) => v },
  // "1249," — a separator typed but not yet followed by decimals. Someone who
  // types an amount and tabs away lands here; refusing it blocked the save.
  { pattern: /^-?\d+[.,]$/, normalise: (v) => v.slice(0, -1) },
  // ",5" — leading separator, meaning nought point five.
  {
    pattern: /^-?[.,]\d+$/,
    normalise: (v) => v.replace(",", ".").replace(/^-?\./, (m) => (m[0] === "-" ? "-0." : "0.")),
  },
];

/**
 * Parses a decimal a German-speaking user is likely to type.
 *
 *   "699"        -> 699
 *   "699,50"     -> 699.5
 *   "1.249,00"   -> 1249
 *   "1249.00"    -> 1249
 *   "1.234.567"  -> 1234567   (dots read as thousands separators)
 *   "1.234.56"   -> null      (not a spelling anyone means)
 *   ""  / "abc"  -> null
 *
 * Returns null for anything it cannot read unambiguously, so callers must
 * decide what to do rather than inheriting a silent wrong number.
 */
export function parseDecimalInput(raw: string): number | null {
  const value = String(raw ?? "")
    .trim()
    .replace(/[\s\u00a0\u202f€]/g, "");
  if (!value || value.length > MAX_INPUT_LENGTH) return null;

  for (const { pattern, normalise } of GRAMMARS) {
    if (pattern.test(value)) {
      const parsed = Number(normalise(value));
      return Number.isFinite(parsed) ? parsed : null;
    }
  }
  return null;
}

/**
 * Parses a money input into whole cents.
 * Returns null when the input is unreadable, negative or implausibly large.
 */
export function parseAmountToCents(raw: string): number | null {
  const parsed = parseDecimalInput(raw);
  if (parsed === null || parsed < 0) return null;
  const cents = Math.round(parsed * 100);
  if (!Number.isSafeInteger(cents) || cents > MAX_CENTS) return null;
  return cents;
}

/** Parses a quantity. Must be greater than zero. */
export function parseQuantity(raw: string): number | null {
  const parsed = parseDecimalInput(raw);
  if (parsed === null || !Number.isFinite(parsed) || parsed <= 0) return null;
  if (parsed > MAX_QUANTITY) return null;
  return parsed;
}

/**
 * Parses a percentage between 0 and 100.
 *
 * An empty field means "use the default" and returns the fallback. Anything
 * unreadable returns null, so the caller can refuse it. Collapsing those two
 * cases meant that typing "7,5%" — with the percent sign — silently booked the
 * 19% default instead of 7.5%, with no error anywhere.
 */
export function parsePercent(raw: string, fallback: number | null = null): number | null {
  const text = String(raw ?? "").trim();
  if (text === "") return fallback;

  // "7,5%" is what people type into a field labelled with a percent sign.
  // parseDecimalInput deliberately does not know about %, so strip exactly one
  // trailing sign here — "%%" or "abc%" must still be refused.
  const withoutSign = text.replace(/\s*%$/, "");
  const parsed = parseDecimalInput(withoutSign);
  if (parsed === null) return null;
  if (parsed < 0 || parsed > 100) return null;
  return parsed;
}

/** Formats cents as a German euro amount. */
export function formatMoney(cents: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
}

/**
 * Line total for an invoice or offer position, in cents.
 * Mirrors what the database computes, and exists so the arithmetic is testable.
 */
export function lineTotalCents(quantity: number, unitPriceCents: number): number {
  return Math.round(quantity * unitPriceCents);
}

/** Net, tax and gross for a set of line totals, applying a discount first. */
export function documentTotals(
  lineTotals: number[],
  options: { discountPercent?: number; taxPercent?: number } = {},
): { subtotalCents: number; discountCents: number; netCents: number; taxCents: number; grossCents: number } {
  const discountPercent = options.discountPercent ?? 0;
  const taxPercent = options.taxPercent ?? 0;

  const subtotalCents = lineTotals.reduce((sum, value) => sum + value, 0);
  const discountCents = Math.round((subtotalCents * discountPercent) / 100);
  const netCents = subtotalCents - discountCents;
  const taxCents = Math.round((netCents * taxPercent) / 100);
  return { subtotalCents, discountCents, netCents, taxCents, grossCents: netCents + taxCents };
}
