"use client";

import { useEffect, useMemo, useState } from "react";
import { adminFetch, adminLogin, adminSessionActive, handleAdminError } from "@/lib/admin-client";
import { formatMoney, parseAmountToCents, parsePercent, parseQuantity } from "@/lib/money";
import { invoicePrintHtml, openPrintWindow } from "@/lib/print-template";
import { company } from "@/lib/company";
import type { Invoice, InvoiceStatus, InvoiceType, PaymentMethod } from "@/lib/billing";
import type { Lead } from "@/lib/leads";
import type { CustomerProject } from "@/lib/projects";

const statusLabels: Record<InvoiceStatus, string> = {
  draft: "Entwurf",
  open: "Offen",
  paid: "Bezahlt",
  overdue: "Überfällig",
  void: "Storniert",
};
const typeLabels: Record<InvoiceType, string> = { setup: "Setup", monthly: "Monatlich", custom: "Einmalig" };
const methodLabels: Record<PaymentMethod, string> = {
  bank_transfer: "Überweisung",
  cash: "Bar",
  stripe: "Stripe",
  paypal: "PayPal",
  other: "Sonstiges",
};

type ItemDraft = { description: string; quantity: string; unit: string; unitPrice: string };
type PaymentDraft = { amount: string; method: PaymentMethod; reference: string; paidAt: string };

function today() {
  return new Date().toISOString().slice(0, 10);
}
function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00`);
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}
function newItem(): ItemDraft {
  return { description: "", quantity: "1", unit: "Stk.", unitPrice: "0.00" };
}

export default function InvoicesAdmin() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<CustomerProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | InvoiceStatus>("all");
  const [search, setSearch] = useState("");

  const [leadId, setLeadId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [invoiceType, setInvoiceType] = useState<InvoiceType>("setup");
  const [title, setTitle] = useState("Website-Erstellung");
  const [issueDate, setIssueDate] = useState(today());
  const [dueDate, setDueDate] = useState(addDays(today(), 14));
  const [taxPercent, setTaxPercent] = useState(company.smallBusiness ? "0" : "19");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemDraft[]>([newItem()]);
  const [payments, setPayments] = useState<Record<number, PaymentDraft>>({});

  const visible = useMemo(
    () =>
      invoices.filter((invoice) => {
        const matchesStatus = filter === "all" || invoice.status === filter;
        const term = search.trim().toLowerCase();
        const matchesSearch =
          !term ||
          [invoice.invoice_number, invoice.company, invoice.title, invoice.project_number || ""].some((value) =>
            value.toLowerCase().includes(term),
          );
        return matchesStatus && matchesSearch;
      }),
    [invoices, filter, search],
  );

  const totalInvoiced = invoices
    .filter((invoice) => invoice.status !== "void")
    .reduce((sum, invoice) => sum + invoice.gross_cents, 0);
  const totalPaid = invoices.reduce((sum, invoice) => sum + invoice.paid_cents, 0);
  const outstanding = invoices
    .filter((invoice) => !["paid", "void"].includes(invoice.status))
    .reduce((sum, invoice) => sum + invoice.balance_cents, 0);
  const overdue = invoices
    .filter((invoice) => invoice.status === "overdue")
    .reduce((sum, invoice) => sum + invoice.balance_cents, 0);

  useEffect(() => {
    void adminSessionActive().then((active) => {
      if (active) void loadAll();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function post(path: string, body: Record<string, unknown> = {}) {
    return adminFetch(path, body);
  }

  async function signIn() {
    setError("");
    try {
      await adminLogin(password);
      setPassword("");
      await loadAll();
    } catch (err) {
      setAuthenticated(false);
      handleAdminError(err, setError, setAuthenticated, "Anmeldung fehlgeschlagen.");
    }
  }

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [invoiceData, leadData, projectData] = await Promise.all([
        post("/api/admin/invoices", { action: "list" }),
        post("/api/admin/leads", {}),
        post("/api/admin/projects", { action: "list" }),
      ]);
      setInvoices(invoiceData.invoices as Invoice[]);
      setLeads(leadData.leads as Lead[]);
      setProjects(projectData.projects as CustomerProject[]);
      setAuthenticated(true);
    } catch (err) {
      setAuthenticated(false);
      handleAdminError(err, setError, setAuthenticated, "Anmeldung fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  function selectProject(value: string) {
    setProjectId(value);
    const project = projects.find((item) => String(item.id) === value);
    if (project) setLeadId(String(project.lead_id));
  }

  async function createNewInvoice() {
    if (!leadId) {
      setError("Bitte zuerst einen Kunden auswählen.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payloadItems = items.map((item) => {
        const quantity = parseQuantity(item.quantity);
        const unitPriceCents = parseAmountToCents(item.unitPrice);
        if (quantity === null || unitPriceCents === null) {
          throw new Error(`Position "${item.description || "ohne Bezeichnung"}": Menge oder Preis ist ungültig.`);
        }
        return { description: item.description.trim(), quantity, unit: item.unit.trim() || "Stk.", unitPriceCents };
      });
      const tax = parsePercent(taxPercent, company.smallBusiness ? 0 : 19);
      if (tax === null) throw new Error("Der Steuersatz muss zwischen 0 und 100 liegen.");
      await post("/api/admin/invoices", {
        action: "create",
        leadId: Number(leadId),
        projectId: projectId ? Number(projectId) : null,
        invoiceType,
        title,
        issueDate,
        dueDate,
        taxPercent: tax,
        notes,
        items: payloadItems,
      });
      setItems([newItem()]);
      setNotes("");
      await loadAll();
    } catch (err) {
      handleAdminError(err, setError, setAuthenticated, "Rechnung konnte nicht erstellt werden.");
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(invoiceId: number, status: "draft" | "open" | "void") {
    setError("");
    try {
      await post("/api/admin/invoices", { action: "status", invoiceId, status });
      await loadAll();
    } catch (err) {
      handleAdminError(err, setError, setAuthenticated, "Status konnte nicht gespeichert werden.");
    }
  }

  async function recordPayment(invoice: Invoice) {
    const draft = payments[invoice.id] || {
      amount: (invoice.balance_cents / 100).toFixed(2),
      method: "bank_transfer" as PaymentMethod,
      reference: "",
      paidAt: new Date().toISOString().slice(0, 16),
    };
    const amountCents = parseAmountToCents(draft.amount);
    if (amountCents === null) {
      setError("Bitte einen gültigen Betrag eingeben, z. B. 1.249,00.");
      return;
    }
    setError("");
    try {
      await post("/api/admin/invoices", {
        action: "payment",
        invoiceId: invoice.id,
        amountCents,
        method: draft.method,
        reference: draft.reference,
        paidAt: draft.paidAt ? new Date(draft.paidAt).toISOString() : "",
      });
      await loadAll();
    } catch (err) {
      handleAdminError(err, setError, setAuthenticated, "Zahlung konnte nicht gespeichert werden.");
    }
  }

  async function removeInvoice(invoice: Invoice) {
    if (!confirm(`Rechnung ${invoice.invoice_number} löschen? Nur Entwürfe ohne Zahlung können gelöscht werden.`))
      return;
    try {
      await post("/api/admin/invoices", { action: "delete", invoiceId: invoice.id });
      await loadAll();
    } catch (err) {
      handleAdminError(err, setError, setAuthenticated, "Rechnung konnte nicht gelöscht werden.");
    }
  }

  function printInvoice(invoice: Invoice) {
    if (!openPrintWindow(invoicePrintHtml(invoice), invoice.invoice_number)) {
      setError("Das Druckfenster wurde vom Browser blockiert. Bitte Pop-ups für diese Seite erlauben.");
    }
  }

  if (!authenticated)
    return (
      <main className="admin">
        <aside>
          <a className="brand" href="/">
            <span>W</span> WebForge
          </a>
        </aside>
        <section>
          <div className="adminhead">
            <div>
              <small>WEBFORGE FINANCE</small>
              <h1>Rechnungen</h1>
            </div>
            <a className="button" href="/admin">
              CRM
            </a>
          </div>
          <div className="adminpanel">
            <h2>Admin Login</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void signIn();
              }}
              style={{ display: "grid", gap: 10, maxWidth: 420 }}
            >
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Adminpasswort"
                required
              />
              <button className="button" disabled={loading}>
                {loading ? "Prüfe …" : "Einloggen"}
              </button>
              {error && <p>{error}</p>}
            </form>
          </div>
        </section>
      </main>
    );

  return (
    <main className="admin">
      <aside>
        <a className="brand" href="/">
          <span>W</span> WebForge
        </a>
        <nav>
          <a href="/admin">CRM</a>
          <a href="/admin/projects">Projekte</a>
          <b>Rechnungen</b>
        </nav>
      </aside>
      <section>
        <div className="adminhead">
          <div>
            <small>FINANCE CONTROL</small>
            <h1>Rechnungen & Zahlungen</h1>
          </div>
          <button className="button" onClick={() => void loadAll()} disabled={loading}>
            {loading ? "Lädt …" : "Aktualisieren"}
          </button>
        </div>
        <div className="stats">
          <article>
            <small>FAKTURIERT</small>
            <strong>{formatMoney(totalInvoiced)}</strong>
            <span>ohne Storno</span>
          </article>
          <article>
            <small>BEZAHLT</small>
            <strong>{formatMoney(totalPaid)}</strong>
            <span>Zahlungseingänge</span>
          </article>
          <article>
            <small>OFFEN</small>
            <strong>{formatMoney(outstanding)}</strong>
            <span>noch einzuziehen</span>
          </article>
          <article>
            <small>ÜBERFÄLLIG</small>
            <strong>{formatMoney(overdue)}</strong>
            <span>Handlungsbedarf</span>
          </article>
        </div>

        <div className="adminpanel">
          <div>
            <small>NEUE RECHNUNG</small>
            <h2>Rechnung erstellen</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 8 }}>
            <select value={leadId} onChange={(e) => setLeadId(e.target.value)}>
              <option value="">Kunde wählen</option>
              {leads
                .filter((lead) => lead.status === "won")
                .map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.company}
                  </option>
                ))}
            </select>
            <select value={projectId} onChange={(e) => selectProject(e.target.value)}>
              <option value="">Kein Projekt</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.project_number} · {project.company}
                </option>
              ))}
            </select>
            <select value={invoiceType} onChange={(e) => setInvoiceType(e.target.value as InvoiceType)}>
              {Object.entries(typeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Rechnungstitel" />
            <label>
              Rechnungsdatum
              <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
            </label>
            <label>
              Fällig am
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </label>
            <input
              value={taxPercent}
              onChange={(e) => setTaxPercent(e.target.value)}
              inputMode="decimal"
              placeholder="MwSt. %"
            />
          </div>
          <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
            {items.map((item, index) => (
              <div key={index} style={{ display: "grid", gridTemplateColumns: "2fr .7fr .7fr 1fr auto", gap: 8 }}>
                <input
                  value={item.description}
                  onChange={(e) =>
                    setItems((current) =>
                      current.map((row, i) => (i === index ? { ...row, description: e.target.value } : row)),
                    )
                  }
                  placeholder="Leistung"
                />
                <input
                  value={item.quantity}
                  onChange={(e) =>
                    setItems((current) =>
                      current.map((row, i) => (i === index ? { ...row, quantity: e.target.value } : row)),
                    )
                  }
                  placeholder="Menge"
                />
                <input
                  value={item.unit}
                  onChange={(e) =>
                    setItems((current) =>
                      current.map((row, i) => (i === index ? { ...row, unit: e.target.value } : row)),
                    )
                  }
                  placeholder="Einheit"
                />
                <input
                  value={item.unitPrice}
                  onChange={(e) =>
                    setItems((current) =>
                      current.map((row, i) => (i === index ? { ...row, unitPrice: e.target.value } : row)),
                    )
                  }
                  placeholder="Preis €"
                />
                <button
                  className="button"
                  onClick={() => setItems((current) => current.filter((_, i) => i !== index))}
                  disabled={items.length === 1}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button className="button" onClick={() => setItems((current) => [...current, newItem()])}>
              Position hinzufügen
            </button>
            <button className="button" onClick={() => void createNewInvoice()} disabled={loading}>
              Rechnung anlegen
            </button>
          </div>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Zahlungshinweise / interne Notiz"
            style={{ marginTop: 10 }}
          />
        </div>

        <div className="adminpanel">
          <div>
            <small>FILTER</small>
            <h2>Rechnungen finden</h2>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nummer, Kunde, Projekt …" />
            <select value={filter} onChange={(e) => setFilter(e.target.value as "all" | InvoiceStatus)}>
              <option value="all">Alle Status</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="adminpanel">
          <div>
            <small>RECHNUNGEN</small>
            <h2>{visible.length} Einträge</h2>
          </div>
          {error && <p>{error}</p>}
          {visible.length === 0 && <p>Noch keine Rechnungen vorhanden.</p>}
          {visible.map((invoice) => {
            const draft = payments[invoice.id] || {
              amount: (invoice.balance_cents / 100).toFixed(2),
              method: "bank_transfer" as PaymentMethod,
              reference: "",
              paidAt: new Date().toISOString().slice(0, 16),
            };
            return (
              <div
                key={invoice.id}
                style={{ padding: "20px 0", borderBottom: "1px solid rgba(255,255,255,.08)", display: "grid", gap: 10 }}
              >
                <div className="adminrow">
                  <span className="dot" />
                  <div>
                    <strong>
                      {invoice.invoice_number} · {invoice.company}
                    </strong>
                    <small>
                      {typeLabels[invoice.invoice_type]} · {invoice.title}
                      {invoice.project_number ? ` · ${invoice.project_number}` : ""}
                    </small>
                  </div>
                  <b>{statusLabels[invoice.status]}</b>
                  <strong>{formatMoney(invoice.gross_cents)}</strong>
                </div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <small>Netto {formatMoney(invoice.net_cents)}</small>
                  <small>Bezahlt {formatMoney(invoice.paid_cents)}</small>
                  <small>Offen {formatMoney(invoice.balance_cents)}</small>
                  <small>Ausgestellt {new Date(invoice.issue_date + "T00:00:00").toLocaleDateString("de-DE")}</small>
                  {invoice.due_date && (
                    <small>Fällig {new Date(invoice.due_date + "T00:00:00").toLocaleDateString("de-DE")}</small>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="button" onClick={() => printInvoice(invoice)}>
                    Drucken / PDF
                  </button>
                  {invoice.status === "draft" && (
                    <button className="button" onClick={() => void changeStatus(invoice.id, "open")}>
                      Als offen stellen
                    </button>
                  )}
                  {!(["paid", "void"] as InvoiceStatus[]).includes(invoice.status) && (
                    <button className="button" onClick={() => void changeStatus(invoice.id, "void")}>
                      Stornieren
                    </button>
                  )}
                  {invoice.status === "draft" && (
                    <button className="button" onClick={() => void removeInvoice(invoice)}>
                      Entwurf löschen
                    </button>
                  )}
                </div>
                {invoice.status !== "void" && invoice.balance_cents > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1.2fr auto", gap: 8 }}>
                    <input
                      value={draft.amount}
                      onChange={(e) =>
                        setPayments((current) => ({ ...current, [invoice.id]: { ...draft, amount: e.target.value } }))
                      }
                      placeholder="Betrag €"
                    />
                    <select
                      value={draft.method}
                      onChange={(e) =>
                        setPayments((current) => ({
                          ...current,
                          [invoice.id]: { ...draft, method: e.target.value as PaymentMethod },
                        }))
                      }
                    >
                      {Object.entries(methodLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="datetime-local"
                      value={draft.paidAt}
                      onChange={(e) =>
                        setPayments((current) => ({ ...current, [invoice.id]: { ...draft, paidAt: e.target.value } }))
                      }
                    />
                    <input
                      value={draft.reference}
                      onChange={(e) =>
                        setPayments((current) => ({
                          ...current,
                          [invoice.id]: { ...draft, reference: e.target.value },
                        }))
                      }
                      placeholder="Referenz / Verwendungszweck"
                    />
                    <button className="button" onClick={() => void recordPayment(invoice)}>
                      Zahlung buchen
                    </button>
                  </div>
                )}
                {invoice.payments.length > 0 && (
                  <div>
                    {invoice.payments.map((payment) => (
                      <small key={payment.id} style={{ display: "block" }}>
                        Zahlung {formatMoney(payment.amount_cents)} · {methodLabels[payment.method]} ·{" "}
                        {new Date(payment.paid_at).toLocaleString("de-DE")}
                        {payment.reference ? ` · ${payment.reference}` : ""}
                      </small>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
