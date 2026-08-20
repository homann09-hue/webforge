/**
 * Company details used by the imprint, the privacy policy and the footer.
 *
 * Fill every field marked TODO with the real, legally binding data. Until you
 * do, `isLegalComplete()` stays false and the pricing section hides its Stripe
 * checkout links — selling from a page with a placeholder imprint is a
 * §5 DDG problem in Germany, and this makes that state impossible to miss.
 *
 * These are deliberately not environment variables: they belong in version
 * control, they are public information, and a missing env var on a preview
 * deployment should not silently produce an empty imprint.
 */
export const company = {
  /** Legal name of the business, exactly as registered. */
  legalName: "TODO",
  /** Trading name shown to customers. */
  tradingName: "WebForge",
  /** Sole trader: the owner's full name. Company: the managing director(s). */
  representative: "TODO",
  street: "TODO",
  postalCode: "TODO",
  city: "TODO",
  country: "Deutschland",
  email: "TODO",
  phone: "TODO",
  /** Optional. Leave empty if you are a Kleinunternehmer under §19 UStG. */
  vatId: "",
  /** Optional. Only if you are entered in a commercial register. */
  registerCourt: "",
  registerNumber: "",
  /** Set true if you invoice without VAT under §19 UStG. */
  smallBusiness: false,
} as const;

const PLACEHOLDER = "TODO";

/** Fields that must carry real data before the site may sell anything. */
const REQUIRED_FIELDS = [
  "legalName",
  "representative",
  "street",
  "postalCode",
  "city",
  "email",
  "phone",
] as const satisfies readonly (keyof typeof company)[];

/**
 * True once every legally required field carries real data.
 *
 * Can be forced on with NEXT_PUBLIC_LEGAL_COMPLETE=1 — useful if your imprint
 * lives elsewhere, but understand what you are switching off.
 */
export function isLegalComplete(): boolean {
  if (process.env.NEXT_PUBLIC_LEGAL_COMPLETE === "1") return true;
  return REQUIRED_FIELDS.every((field) => {
    const value = company[field];
    return typeof value === "string" && value.trim().length > 0 && value !== PLACEHOLDER;
  });
}

/** Renders a field for display, marking anything still unfilled. */
export function field(value: string): string {
  return !value || value === PLACEHOLDER ? "[noch einzutragen]" : value;
}

export const addressLines = () => [
  field(company.legalName),
  company.representative !== company.legalName ? field(company.representative) : "",
  field(company.street),
  `${field(company.postalCode)} ${field(company.city)}`,
  company.country,
];
