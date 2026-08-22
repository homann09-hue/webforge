import type { Invoice } from "@/lib/billing";
import type { Offer } from "@/lib/offers";
import { company, field } from "@/lib/company";
import { formatMoney } from "@/lib/money";

/**
 * HTML for the printable offer and invoice views.
 *
 * These used to be two ~2000-character template literals inline in the admin
 * pages, which meant the escaping could not be tested — and escaping is the
 * whole security story here: every value comes from a lead who typed it into
 * a public form, and it is interpolated straight into a document.
 */

const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Escapes a value for interpolation into HTML text or a quoted attribute. */
export function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (char) => HTML_ENTITIES[char] ?? char);
}

function germanDate(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("de-DE");
}

const STYLES = `
  body { font: 15px Arial, sans-serif; color: #111; padding: 48px; max-width: 900px; margin: auto; }
  header { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 48px; }
  h1 { font-size: 28px; margin: 0; }
  small { color: #666; }
  table { width: 100%; border-collapse: collapse; margin: 28px 0; }
  th, td { padding: 10px; border-bottom: 1px solid #ddd; text-align: left; }
  td.num, th.num { text-align: right; }
  .totals { margin-left: auto; width: 320px; }
  .totals div { display: flex; justify-content: space-between; padding: 6px 0; }
  .total { font-size: 20px; font-weight: 700; border-top: 2px solid #111; margin-top: 8px; padding-top: 12px !important; }
  .issuer { margin-top: 48px; color: #666; font-size: 13px; line-height: 1.6; }
  @media print { button { display: none } body { padding: 20px } }
`;

function issuerBlock(): string {
  const lines = [
    field(company.legalName),
    field(company.street),
    `${field(company.postalCode)} ${field(company.city)}`,
    field(company.email),
    company.vatId ? `USt-IdNr.: ${company.vatId}` : "",
    company.smallBusiness ? "Gemäß § 19 UStG wird keine Umsatzsteuer berechnet." : "",
  ].filter(Boolean);
  return `<div class="issuer">${lines.map(escapeHtml).join("<br>")}</div>`;
}

function htmlDocument(title: string, body: string): string {
  return [
    "<!doctype html>",
    '<html lang="de"><head>',
    '<meta charset="utf-8">',
    `<title>${escapeHtml(title)}</title>`,
    `<style>${STYLES}</style>`,
    "</head><body>",
    '<button id="print-button" type="button">Als PDF drucken / speichern</button>',
    body,
    "</body></html>",
  ].join("");
}

function recipientBlock(input: { company: string; contact_name: string | null; email: string }): string {
  const contact = input.contact_name ? `<br>${escapeHtml(input.contact_name)}` : "";
  return `<p><b>${escapeHtml(input.company)}</b>${contact}<br>${escapeHtml(input.email)}</p>`;
}

export function offerPrintHtml(offer: Offer): string {
  const rows = offer.items
    .map(
      (item) =>
        `<tr><td>${escapeHtml(item.position)}</td><td>${escapeHtml(item.description)}</td>` +
        `<td>${escapeHtml(item.quantity)} ${escapeHtml(item.unit)}</td>` +
        `<td class="num">${escapeHtml(formatMoney(item.unit_price_cents))}</td>` +
        `<td class="num">${escapeHtml(formatMoney(item.line_total_cents))}</td></tr>`,
    )
    .join("");

  const validUntil = germanDate(offer.valid_until);
  const taxRows = company.smallBusiness
    ? ""
    : [
        `<div><span>Netto</span><span>${escapeHtml(formatMoney(offer.net_cents))}</span></div>`,
        `<div><span>MwSt. (${escapeHtml(offer.tax_percent)}%)</span><span>${escapeHtml(formatMoney(offer.tax_cents))}</span></div>`,
      ].join("");

  const body = [
    `<header><div><h1>WebForge</h1><small>Professionelle Websites für Unternehmen</small></div>`,
    `<div><b>Angebot ${escapeHtml(offer.offer_number)}</b><br><small>${escapeHtml(germanDate(offer.created_at))}</small></div></header>`,
    `<h2>${escapeHtml(offer.title)}</h2>`,
    recipientBlock(offer),
    `<table><thead><tr><th>Pos.</th><th>Leistung</th><th>Menge</th><th class="num">Einzel</th><th class="num">Gesamt</th></tr></thead>`,
    `<tbody>${rows}</tbody></table>`,
    `<div class="totals">`,
    `<div><span>Zwischensumme</span><span>${escapeHtml(formatMoney(offer.subtotal_cents))}</span></div>`,
    `<div><span>Rabatt (${escapeHtml(offer.discount_percent)}%)</span><span>− ${escapeHtml(formatMoney(offer.discount_cents))}</span></div>`,
    taxRows,
    `<div class="total"><span>Gesamt</span><span>${escapeHtml(formatMoney(offer.gross_cents))}</span></div>`,
    `</div>`,
    validUntil ? `<p>Gültig bis: ${escapeHtml(validUntil)}</p>` : "",
    offer.notes ? `<p>${escapeHtml(offer.notes)}</p>` : "",
    issuerBlock(),
  ].join("");

  return htmlDocument(offer.offer_number, body);
}

export function invoicePrintHtml(invoice: Invoice): string {
  const rows = invoice.items
    .map(
      (item) =>
        `<tr><td>${escapeHtml(item.position)}</td><td>${escapeHtml(item.description)}</td>` +
        `<td>${escapeHtml(item.quantity)} ${escapeHtml(item.unit)}</td>` +
        `<td class="num">${escapeHtml(formatMoney(item.unit_price_cents))}</td>` +
        `<td class="num">${escapeHtml(formatMoney(item.line_total_cents))}</td></tr>`,
    )
    .join("");

  const dueDate = germanDate(invoice.due_date);
  const taxRows = company.smallBusiness
    ? ""
    : [
        `<div><span>Netto</span><span>${escapeHtml(formatMoney(invoice.net_cents))}</span></div>`,
        `<div><span>MwSt. (${escapeHtml(invoice.tax_percent)}%)</span><span>${escapeHtml(formatMoney(invoice.tax_cents))}</span></div>`,
      ].join("");

  const body = [
    `<header><div><h1>WebForge</h1><small>Professionelle Websites für Unternehmen</small></div>`,
    `<div><b>Rechnung ${escapeHtml(invoice.invoice_number)}</b><br><small>${escapeHtml(germanDate(invoice.issue_date))}</small></div></header>`,
    `<h2>${escapeHtml(invoice.title)}</h2>`,
    recipientBlock(invoice),
    invoice.project_number
      ? `<p><small>Projekt ${escapeHtml(invoice.project_number)}${invoice.project_name ? ` · ${escapeHtml(invoice.project_name)}` : ""}</small></p>`
      : "",
    `<table><thead><tr><th>Pos.</th><th>Leistung</th><th>Menge</th><th class="num">Einzel</th><th class="num">Gesamt</th></tr></thead>`,
    `<tbody>${rows}</tbody></table>`,
    `<div class="totals">`,
    taxRows,
    `<div class="total"><span>Gesamt</span><span>${escapeHtml(formatMoney(invoice.gross_cents))}</span></div>`,
    invoice.paid_cents > 0
      ? `<div><span>Bereits gezahlt</span><span>− ${escapeHtml(formatMoney(invoice.paid_cents))}</span></div>` +
        `<div><span>Offen</span><span>${escapeHtml(formatMoney(invoice.balance_cents))}</span></div>`
      : "",
    `</div>`,
    dueDate ? `<p>Zahlbar bis: ${escapeHtml(dueDate)}</p>` : "",
    invoice.notes ? `<p>${escapeHtml(invoice.notes)}</p>` : "",
    issuerBlock(),
  ].join("");

  return htmlDocument(invoice.invoice_number, body);
}

/**
 * Opens a printable document in a popup.
 *
 * The print button gets its handler attached from here rather than through an
 * inline onclick, so the popup does not depend on `unsafe-inline` in the CSP.
 */
export function openPrintWindow(html: string, title: string): boolean {
  const popup = window.open("", "_blank", "width=900,height=1100");
  if (!popup) return false;
  popup.document.write(html);
  popup.document.close();
  popup.document.title = title;
  popup.document.getElementById("print-button")?.addEventListener("click", () => popup.print());
  popup.focus();
  return true;
}
