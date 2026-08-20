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

/**
 * Parses a decimal a German-speaking user is likely to type.
 *
 *   "699"        -> 699
 *   "699,50"     -> 699.5
 *   "1.249,00"   -> 1249
 *   "1249.00"    -> 1249
 *   "1.234.567"  -> 1234567   (dots read as thousands separators)
 *   ""  / "abc"  -> null
 *
 * Returns null for anything it cannot read, so callers must decide what to do
 * rather than inheriting a silent zero.
 */
export function parseDecimalInput(raw: string): number | null {
  const value = String(raw ?? "")
    .trim()
    .replace(/\s|€/g, "");
  if (!value) return null;
  if (!/^-?[\d.,]+$/.test(value)) return null;

  const lastComma = value.lastIndexOf(",");
  const lastDot = value.lastIndexOf(".");

  let normalised: string;
  if (lastComma >= 0 && lastDot >= 0) {
    // Both present: whichever comes last is the decimal separator.
    const decimalSeparator = lastComma > lastDot ? "," : ".";
    const thousandsSeparator = decimalSeparator === "," ? "." : ",";
    normalised = value.split(thousandsSeparator).join("").replace(decimalSeparator, ".");
  } else if (lastComma >= 0) {
    // Only commas: a single one is decimal, several are thousands separators.
    normalised = value.split(",").length === 2 ? value.replace(",", ".") : value.split(",").join("");
  } else if (lastDot >= 0) {
    // Only dots. "1.234" is ambiguous; treat groups of exactly three digits
    // as thousands separators, which is how a German user means it.
    normalised = /^-?\d{1,3}(\.\d{3})+$/.test(value) ? value.split(".").join("") : value;
    if (normalised.split(".").length > 2) normalised = normalised.split(".").join("");
  } else {
    normalised = value;
  }

  const parsed = Number(normalised);
  return Number.isFinite(parsed) ? parsed : null;
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
  return parsed;
}

/** Parses a percentage between 0 and 100. */
export function parsePercent(raw: string, fallback: number | null = null): number | null {
  const parsed = parseDecimalInput(raw);
  if (parsed === null) return fallback;
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
