import { describe, expect, it } from "vitest";
import { escapeHtml, invoicePrintHtml, offerPrintHtml } from "@/lib/print-template";
import type { Offer } from "@/lib/offers";
import type { Invoice } from "@/lib/billing";

const XSS = '<script>alert("x")</script>';

const offer: Offer = {
  id: 1,
  lead_id: 1,
  offer_number: "AN-2026-001",
  title: "Website-Paket",
  status: "sent",
  discount_percent: 10,
  tax_percent: 19,
  valid_until: "2026-09-30",
  notes: null,
  created_at: "2026-08-20T10:00:00Z",
  updated_at: "2026-08-20T10:00:00Z",
  company: "Mustermann GmbH",
  contact_name: "Erika Muster",
  email: "info@mustermann.de",
  items: [
    {
      id: 1,
      position: 1,
      description: "Webdesign & Umsetzung",
      quantity: 1,
      unit: "Pauschal",
      unit_price_cents: 69900,
      line_total_cents: 69900,
    },
  ],
  subtotal_cents: 69900,
  discount_cents: 6990,
  net_cents: 62910,
  tax_cents: 11953,
  gross_cents: 74863,
};

const invoice: Invoice = {
  id: 1,
  lead_id: 1,
  project_id: null,
  invoice_number: "RE-2026-001",
  invoice_type: "setup",
  title: "Website-Erstellung",
  status: "open",
  issue_date: "2026-08-20",
  due_date: "2026-09-03",
  tax_percent: 19,
  notes: null,
  company: "Mustermann GmbH",
  contact_name: "Erika Muster",
  email: "info@mustermann.de",
  project_number: null,
  project_name: null,
  net_cents: 62910,
  tax_cents: 11953,
  gross_cents: 74863,
  paid_cents: 0,
  balance_cents: 74863,
  created_at: "2026-08-20T10:00:00Z",
  items: offer.items.map((item) => ({ ...item })),
  payments: [],
};

describe("escapeHtml", () => {
  it("escapes every character that can break out of markup", () => {
    expect(escapeHtml(`<>&"'`)).toBe("&lt;&gt;&amp;&quot;&#39;");
  });

  it("handles null and undefined without throwing", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });

  it("leaves ordinary text alone", () => {
    expect(escapeHtml("Mustermann GmbH & Co. KG")).toBe("Mustermann GmbH &amp; Co. KG");
  });
});

describe("offerPrintHtml", () => {
  it("produces a complete document", () => {
    const html = offerPrintHtml(offer);
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain("AN-2026-001");
    expect(html).toContain("Mustermann GmbH");
  });

  it("shows the totals", () => {
    const html = offerPrintHtml(offer);
    expect(html).toContain("748,63");
    expect(html).toContain("Rabatt (10%)");
  });

  it("escapes attacker-controlled fields", () => {
    // Every one of these arrives from a lead who typed it into a public form.
    const html = offerPrintHtml({
      ...offer,
      company: XSS,
      contact_name: XSS,
      title: XSS,
      notes: XSS,
      items: [{ ...offer.items[0], description: XSS, unit: XSS }],
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("omits the validity line when there is no date", () => {
    expect(offerPrintHtml({ ...offer, valid_until: null })).not.toContain("Gültig bis");
  });

  it("uses no inline event handler, so it needs no unsafe-inline", () => {
    expect(offerPrintHtml(offer)).not.toMatch(/onclick=/i);
  });
});

describe("invoicePrintHtml", () => {
  it("produces a complete document", () => {
    const html = invoicePrintHtml(invoice);
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain("RE-2026-001");
  });

  it("shows the outstanding balance once something is paid", () => {
    const html = invoicePrintHtml({ ...invoice, paid_cents: 20000, balance_cents: 54863 });
    expect(html).toContain("Bereits gezahlt");
    expect(html).toContain("Offen");
  });

  it("hides the balance block when nothing is paid", () => {
    expect(invoicePrintHtml(invoice)).not.toContain("Bereits gezahlt");
  });

  it("escapes attacker-controlled fields", () => {
    const html = invoicePrintHtml({ ...invoice, company: XSS, title: XSS });
    expect(html).not.toContain("<script>");
  });
});
