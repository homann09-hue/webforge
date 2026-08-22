"use client";

import { useEffect, useMemo, useState } from "react";
import { adminFetch, adminLogin, adminLogout, adminSessionActive, handleAdminError } from "@/lib/admin-client";
import { formatMoney, parseAmountToCents, parsePercent, parseQuantity } from "@/lib/money";
import { offerPrintHtml, openPrintWindow } from "@/lib/print-template";
import { company } from "@/lib/company";
import { sites } from "@/lib/site-config";
import type { Lead, LeadStatus, ProposalStatus } from "@/lib/leads";
import type { Offer, OfferStatus } from "@/lib/offers";

const statusLabels: Record<LeadStatus, string> = {
  new: "Neu",
  contacted: "Kontaktiert",
  qualified: "Qualifiziert",
  won: "Gewonnen",
  lost: "Verloren",
};
const proposalLabels: Record<ProposalStatus, string> = {
  none: "Kein Angebot",
  draft: "Entwurf",
  sent: "Gesendet",
  accepted: "Angenommen",
  rejected: "Abgelehnt",
};
const offerStatusLabels: Record<OfferStatus, string> = {
  draft: "Entwurf",
  sent: "Gesendet",
  accepted: "Angenommen",
  rejected: "Abgelehnt",
};

type CommercialDraft = {
  contactName: string;
  phone: string;
  packageName: string;
  setupPrice: string;
  monthlyPrice: string;
  proposalStatus: ProposalStatus;
};
type OfferItemDraft = { description: string; quantity: string; unit: string; unitPrice: string };

function draftFromLead(lead: Lead): CommercialDraft {
  return {
    contactName: lead.contact_name || "",
    phone: lead.phone || "",
    packageName: lead.package_name || "",
    setupPrice: (lead.setup_price_cents / 100).toFixed(2),
    monthlyPrice: (lead.monthly_price_cents / 100).toFixed(2),
    proposalStatus: lead.proposal_status,
  };
}

export default function Admin() {
  const [password, setPassword] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | LeadStatus>("all");
  const [showArchived, setShowArchived] = useState(false);
  const [draftNotes, setDraftNotes] = useState<Record<number, string>>({});
  const [commercial, setCommercial] = useState<Record<number, CommercialDraft>>({});

  const [offerLeadId, setOfferLeadId] = useState<number | null>(null);
  const [offerTitle, setOfferTitle] = useState("Website-Paket");
  const [offerDiscount, setOfferDiscount] = useState("0");
  const [offerTax, setOfferTax] = useState(company.smallBusiness ? "0" : "19");
  const [offerValidUntil, setOfferValidUntil] = useState("");
  const [offerNotes, setOfferNotes] = useState("");
  const [offerItems, setOfferItems] = useState<OfferItemDraft[]>([
    { description: "Webdesign & Umsetzung", quantity: "1", unit: "Pauschal", unitPrice: "699" },
  ]);

  const filteredLeads = useMemo(
    () =>
      leads.filter((lead) => {
        const term = search.trim().toLowerCase();
        const matchesSearch =
          !term ||
          [
            lead.company,
            lead.email,
            lead.website || "",
            lead.notes || "",
            lead.contact_name || "",
            lead.phone || "",
            lead.package_name || "",
          ].some((value) => value.toLowerCase().includes(term));
        const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
        const matchesArchive = showArchived ? Boolean(lead.archived_at) : !lead.archived_at;
        return matchesSearch && matchesStatus && matchesArchive;
      }),
    [leads, search, statusFilter, showArchived],
  );

  const active = leads.filter((lead) => !lead.archived_at);
  const newLeads = active.filter((lead) => lead.status === "new").length;
  const customers = active.filter((lead) => lead.status === "won");
  const mrr = customers.reduce((sum, lead) => sum + lead.monthly_price_cents, 0);
  const acceptedOfferVolume = offers
    .filter((offer) => offer.status === "accepted")
    .reduce((sum, offer) => sum + offer.gross_cents, 0);

  useEffect(() => {
    void adminSessionActive().then((active) => {
      if (active) void loadWorkspace();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function request(path: string, body: Record<string, unknown> = {}) {
    return adminFetch(path, body);
  }

  async function signIn() {
    setError("");
    try {
      await adminLogin(password);
      setPassword("");
      await loadWorkspace();
    } catch (err) {
      setAuthenticated(false);
      handleAdminError(err, setError, setAuthenticated, "Anmeldung fehlgeschlagen.");
    }
  }

  async function loadWorkspace() {
    setLoading(true);
    setError("");
    try {
      const [leadData, offerData] = await Promise.all([
        request("/api/admin/leads", {}),
        request("/api/admin/offers", { action: "list" }),
      ]);
      const loaded = leadData.leads as Lead[];
      setLeads(loaded);
      setOffers(offerData.offers as Offer[]);
      setDraftNotes(Object.fromEntries(loaded.map((lead) => [lead.id, lead.notes || ""])));
      setCommercial(Object.fromEntries(loaded.map((lead) => [lead.id, draftFromLead(lead)])));
      if (!offerLeadId && loaded[0]) setOfferLeadId(loaded[0].id);
      setAuthenticated(true);
    } catch (err) {
      setAuthenticated(false);
      handleAdminError(err, setError, setAuthenticated, "Anmeldung fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(leadId: number, status: LeadStatus) {
    setSavingId(leadId);
    setError("");
    try {
      await request("/api/admin/leads/status", { leadId, status });
      await loadWorkspace();
    } catch (err) {
      handleAdminError(err, setError, setAuthenticated, "Status konnte nicht gespeichert werden.");
    } finally {
      setSavingId(null);
    }
  }

  async function saveNotes(leadId: number) {
    setSavingId(leadId);
    setError("");
    try {
      const notes = draftNotes[leadId] || "";
      await request("/api/admin/leads/manage", { action: "notes", leadId, notes });
      setLeads((items) => items.map((lead) => (lead.id === leadId ? { ...lead, notes: notes.trim() || null } : lead)));
    } catch (err) {
      handleAdminError(err, setError, setAuthenticated, "Notiz konnte nicht gespeichert werden.");
    } finally {
      setSavingId(null);
    }
  }

  async function saveCommercial(leadId: number) {
    const draft = commercial[leadId];
    if (!draft) return;
    setSavingId(leadId);
    setError("");
    try {
      const setupPriceCents = parseAmountToCents(draft.setupPrice || "0");
      const monthlyPriceCents = parseAmountToCents(draft.monthlyPrice || "0");
      if (setupPriceCents === null || monthlyPriceCents === null) {
        throw new Error("Bitte gültige Beträge eingeben, z. B. 1.249,00.");
      }
      await request("/api/admin/leads/commercial", {
        leadId,
        contactName: draft.contactName,
        phone: draft.phone,
        packageName: draft.packageName,
        setupPriceCents,
        monthlyPriceCents,
        proposalStatus: draft.proposalStatus,
      });
      await loadWorkspace();
    } catch (err) {
      handleAdminError(err, setError, setAuthenticated, "Kundendaten konnten nicht gespeichert werden.");
    } finally {
      setSavingId(null);
    }
  }

  async function markContacted(leadId: number) {
    setSavingId(leadId);
    setError("");
    try {
      await request("/api/admin/leads/manage", { action: "contacted", leadId });
      await loadWorkspace();
    } catch (err) {
      handleAdminError(err, setError, setAuthenticated, "Kontakt konnte nicht gespeichert werden.");
    } finally {
      setSavingId(null);
    }
  }

  async function toggleArchive(lead: Lead) {
    setSavingId(lead.id);
    setError("");
    try {
      await request("/api/admin/leads/manage", { action: "archive", leadId: lead.id, archived: !lead.archived_at });
      await loadWorkspace();
    } catch (err) {
      handleAdminError(err, setError, setAuthenticated, "Archivierung fehlgeschlagen.");
    } finally {
      setSavingId(null);
    }
  }

  async function removeLead(lead: Lead) {
    if (!confirm(`Lead „${lead.company}“ endgültig löschen?`)) return;
    setSavingId(lead.id);
    setError("");
    try {
      await request("/api/admin/leads/manage", { action: "delete", leadId: lead.id });
      await loadWorkspace();
    } catch (err) {
      handleAdminError(err, setError, setAuthenticated, "Lead konnte nicht gelöscht werden.");
    } finally {
      setSavingId(null);
    }
  }

  function updateDraft(leadId: number, patch: Partial<CommercialDraft>) {
    setCommercial((items) => ({ ...items, [leadId]: { ...items[leadId], ...patch } }));
  }
  function updateOfferItem(index: number, patch: Partial<OfferItemDraft>) {
    setOfferItems((items) => items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  async function createNewOffer() {
    if (!offerLeadId) {
      setError("Bitte zuerst einen Lead auswählen.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const items = offerItems.map((item) => {
        const quantity = parseQuantity(item.quantity);
        const unitPriceCents = parseAmountToCents(item.unitPrice);
        if (quantity === null || unitPriceCents === null) {
          throw new Error(`Position "${item.description || "ohne Bezeichnung"}": Menge oder Preis ist ungültig.`);
        }
        return { description: item.description.trim(), quantity, unit: item.unit.trim() || "Stk.", unitPriceCents };
      });
      const discountPercent = parsePercent(offerDiscount, 0);
      const taxPercent = parsePercent(offerTax, company.smallBusiness ? 0 : 19);
      if (discountPercent === null || taxPercent === null) {
        throw new Error("Rabatt und Steuersatz müssen zwischen 0 und 100 liegen.");
      }
      await request("/api/admin/offers", {
        action: "create",
        leadId: offerLeadId,
        title: offerTitle,
        discountPercent,
        taxPercent,
        validUntil: offerValidUntil,
        notes: offerNotes,
        items,
      });
      setOfferTitle("Website-Paket");
      setOfferDiscount("0");
      setOfferTax(company.smallBusiness ? "0" : "19");
      setOfferValidUntil("");
      setOfferNotes("");
      setOfferItems([{ description: "Webdesign & Umsetzung", quantity: "1", unit: "Pauschal", unitPrice: "699" }]);
      await loadWorkspace();
    } catch (err) {
      handleAdminError(err, setError, setAuthenticated, "Angebot konnte nicht erstellt werden.");
    } finally {
      setLoading(false);
    }
  }

  async function changeOfferStatus(offerId: number, status: OfferStatus) {
    setSavingId(offerId);
    setError("");
    try {
      await request("/api/admin/offers", { action: "status", offerId, status });
      await loadWorkspace();
    } catch (err) {
      handleAdminError(err, setError, setAuthenticated, "Angebotsstatus konnte nicht gespeichert werden.");
    } finally {
      setSavingId(null);
    }
  }

  async function removeOffer(offer: Offer) {
    if (!confirm(`Angebot ${offer.offer_number} endgültig löschen?`)) return;
    setSavingId(offer.id);
    setError("");
    try {
      await request("/api/admin/offers", { action: "delete", offerId: offer.id });
      await loadWorkspace();
    } catch (err) {
      handleAdminError(err, setError, setAuthenticated, "Angebot konnte nicht gelöscht werden.");
    } finally {
      setSavingId(null);
    }
  }

  function printOffer(offer: Offer) {
    if (!openPrintWindow(offerPrintHtml(offer), offer.offer_number)) {
      setError("Das Druckfenster wurde vom Browser blockiert. Bitte Pop-ups für diese Seite erlauben.");
    }
  }

  async function logout() {
    // Clear local state first. Awaiting the revoke before touching the UI made
    // a slow DELETE look like a dead button: no spinner, still logged in,
    // still clickable. The warning below arrives afterwards if it is needed.
    setPassword("");
    setLeads([]);
    setOffers([]);
    setAuthenticated(false);
    setError("");

    const revoked = await adminLogout();
    if (!revoked) {
      setError(
        "Abgemeldet — die Sitzung konnte serverseitig aber nicht widerrufen werden. " +
          "Sie bleibt bis zu 8 Stunden gültig.",
      );
    }
  }

  if (!authenticated)
    return (
      <main className="admin">
        <aside>
          <a className="brand" href="/">
            <span>W</span> WebForge
          </a>
          <nav>
            <b>Admin</b>
          </nav>
        </aside>
        <section>
          <div className="adminhead">
            <div>
              <small>WEBFORGE CONTROL</small>
              <h1>Admin Login</h1>
            </div>
            <a className="button" href="/">
              Website öffnen ↗
            </a>
          </div>
          <div className="adminpanel">
            <small>SICHERER ZUGANG</small>
            <h2>Sales, Kunden & Angebote</h2>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void signIn();
              }}
              style={{ display: "grid", gap: 12, maxWidth: 440 }}
            >
              <label className="sr-only" htmlFor="admin-password">
                Adminpasswort
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Adminpasswort"
                required
              />
              <button className="button" type="submit" disabled={loading}>
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
          <b>Übersicht</b>
          <span>Leads</span>
          <span>Kunden</span>
          <span>Angebote</span>
          <span>Websites</span>
        </nav>
      </aside>
      <section>
        <div className="adminhead">
          <div>
            <small>WEBFORGE CONTROL</small>
            <h1>Sales CRM</h1>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="button" onClick={() => void loadWorkspace()}>
              {loading ? "Lädt …" : "Aktualisieren"}
            </button>
            <button className="button" onClick={() => void logout()}>
              Abmelden
            </button>
          </div>
        </div>
        <div className="stats">
          <article>
            <small>NEUE LEADS</small>
            <strong>{newLeads}</strong>
            <span>offen</span>
          </article>
          <article>
            <small>KUNDEN</small>
            <strong>{customers.length}</strong>
            <span>{formatMoney(acceptedOfferVolume)} Angebotsvolumen</span>
          </article>
          <article>
            <small>MRR</small>
            <strong>{formatMoney(mrr)}</strong>
            <span>monatlich</span>
          </article>
        </div>

        <div className="adminpanel">
          <div>
            <small>ANGEBOT ERSTELLEN</small>
            <h2>Neues Kundenangebot</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 8 }}>
            <select value={offerLeadId ?? ""} onChange={(e) => setOfferLeadId(Number(e.target.value))}>
              <option value="">Lead wählen</option>
              {active.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.company}
                </option>
              ))}
            </select>
            <input value={offerTitle} onChange={(e) => setOfferTitle(e.target.value)} placeholder="Angebotstitel" />
            <input
              value={offerDiscount}
              onChange={(e) => setOfferDiscount(e.target.value)}
              inputMode="decimal"
              placeholder="Rabatt %"
            />
            <input
              value={offerTax}
              onChange={(e) => setOfferTax(e.target.value)}
              inputMode="decimal"
              placeholder="MwSt. %"
            />
            <input type="date" value={offerValidUntil} onChange={(e) => setOfferValidUntil(e.target.value)} />
          </div>
          <textarea
            value={offerNotes}
            onChange={(e) => setOfferNotes(e.target.value)}
            placeholder="Hinweise / Zahlungsbedingungen"
            rows={2}
          />
          <div style={{ display: "grid", gap: 8 }}>
            {offerItems.map((item, index) => (
              <div key={index} style={{ display: "grid", gridTemplateColumns: "2fr .7fr .8fr 1fr auto", gap: 8 }}>
                <input
                  value={item.description}
                  onChange={(e) => updateOfferItem(index, { description: e.target.value })}
                  placeholder="Leistung"
                />
                <input
                  value={item.quantity}
                  onChange={(e) => updateOfferItem(index, { quantity: e.target.value })}
                  inputMode="decimal"
                  placeholder="Menge"
                />
                <input
                  value={item.unit}
                  onChange={(e) => updateOfferItem(index, { unit: e.target.value })}
                  placeholder="Einheit"
                />
                <input
                  value={item.unitPrice}
                  onChange={(e) => updateOfferItem(index, { unitPrice: e.target.value })}
                  inputMode="decimal"
                  placeholder="Preis €"
                />
                <button
                  className="button"
                  type="button"
                  onClick={() => setOfferItems((items) => items.filter((_, i) => i !== index))}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              className="button"
              type="button"
              onClick={() =>
                setOfferItems((items) => [...items, { description: "", quantity: "1", unit: "Stk.", unitPrice: "0" }])
              }
            >
              Position hinzufügen
            </button>
            <button className="button" type="button" onClick={() => void createNewOffer()} disabled={loading}>
              Angebot speichern
            </button>
          </div>
        </div>

        <div className="adminpanel">
          <div>
            <small>ANGEBOTE</small>
            <h2>{offers.length} Angebote</h2>
          </div>
          {offers.length === 0 && <p>Noch keine Angebote vorhanden.</p>}
          {offers.map((offer) => (
            <div
              key={offer.id}
              style={{ padding: "18px 0", borderBottom: "1px solid rgba(255,255,255,.08)", display: "grid", gap: 10 }}
            >
              <div className="adminrow">
                <span className="dot" />
                <div>
                  <strong>
                    {offer.offer_number} · {offer.title}
                  </strong>
                  <small>
                    {offer.company} · {offer.items.length} Position(en)
                  </small>
                </div>
                <select
                  value={offer.status}
                  disabled={savingId === offer.id}
                  onChange={(e) => void changeOfferStatus(offer.id, e.target.value as OfferStatus)}
                >
                  {Object.entries(offerStatusLabels).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
                <strong>{formatMoney(offer.gross_cents)}</strong>
              </div>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                <small>Netto: {formatMoney(offer.net_cents)}</small>
                <small>MwSt.: {formatMoney(offer.tax_cents)}</small>
                <small>Rabatt: {offer.discount_percent}%</small>
                {offer.valid_until && (
                  <small>Gültig bis: {new Date(offer.valid_until).toLocaleDateString("de-DE")}</small>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="button" onClick={() => printOffer(offer)}>
                  PDF / Drucken
                </button>
                <button className="button" disabled={savingId === offer.id} onClick={() => void removeOffer(offer)}>
                  Löschen
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="adminpanel">
          <div>
            <small>FILTER</small>
            <h2>Leads & Kunden finden</h2>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Firma, Kontakt, Paket, E-Mail …"
              style={{ minWidth: 280 }}
            />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "all" | LeadStatus)}>
              <option value="all">Alle Status</option>
              {Object.entries(statusLabels).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />{" "}
              Archiv anzeigen
            </label>
          </div>
        </div>

        <div className="adminpanel">
          <div>
            <small>PIPELINE</small>
            <h2>{filteredLeads.length} Treffer</h2>
          </div>
          {error && <p>{error}</p>}
          {filteredLeads.map((lead) => {
            const draft = commercial[lead.id] || draftFromLead(lead);
            return (
              <div
                key={lead.id}
                style={{ padding: "20px 0", borderBottom: "1px solid rgba(255,255,255,.08)", display: "grid", gap: 12 }}
              >
                <div className="adminrow">
                  <span className="dot" />
                  <div>
                    <strong>{lead.company}</strong>
                    <small>
                      <a href={`mailto:${lead.email}`}>{lead.email}</a>
                      {lead.website ? (
                        <>
                          {" "}
                          ·{" "}
                          <a
                            href={/^https?:\/\//i.test(lead.website) ? lead.website : `https://${lead.website}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {lead.website}
                          </a>
                        </>
                      ) : null}
                    </small>
                  </div>
                  <select
                    value={lead.status}
                    disabled={savingId === lead.id}
                    onChange={(e) => void changeStatus(lead.id, e.target.value as LeadStatus)}
                  >
                    {Object.entries(statusLabels).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                  <small>{new Date(lead.created_at).toLocaleString("de-DE")}</small>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 8 }}>
                  <input
                    value={draft.contactName}
                    onChange={(e) => updateDraft(lead.id, { contactName: e.target.value })}
                    placeholder="Ansprechpartner"
                  />
                  <input
                    value={draft.phone}
                    onChange={(e) => updateDraft(lead.id, { phone: e.target.value })}
                    placeholder="Telefon"
                  />
                  <input
                    value={draft.packageName}
                    onChange={(e) => updateDraft(lead.id, { packageName: e.target.value })}
                    placeholder="Paket"
                  />
                  <input
                    value={draft.setupPrice}
                    onChange={(e) => updateDraft(lead.id, { setupPrice: e.target.value })}
                    inputMode="decimal"
                    placeholder="Setup €"
                  />
                  <input
                    value={draft.monthlyPrice}
                    onChange={(e) => updateDraft(lead.id, { monthlyPrice: e.target.value })}
                    inputMode="decimal"
                    placeholder="Monatlich €"
                  />
                  <select
                    value={draft.proposalStatus}
                    onChange={(e) => updateDraft(lead.id, { proposalStatus: e.target.value as ProposalStatus })}
                  >
                    {Object.entries(proposalLabels).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <textarea
                  value={draftNotes[lead.id] || ""}
                  onChange={(e) => setDraftNotes((n) => ({ ...n, [lead.id]: e.target.value }))}
                  placeholder="Interne Notiz …"
                  rows={3}
                />
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    className="button"
                    disabled={savingId === lead.id}
                    onClick={() => void saveCommercial(lead.id)}
                  >
                    Kundenakte speichern
                  </button>
                  <button className="button" disabled={savingId === lead.id} onClick={() => void saveNotes(lead.id)}>
                    Notiz speichern
                  </button>
                  <button
                    className="button"
                    disabled={savingId === lead.id}
                    onClick={() => void markContacted(lead.id)}
                  >
                    Kontakt jetzt
                  </button>
                  <button className="button" disabled={savingId === lead.id} onClick={() => void toggleArchive(lead)}>
                    {lead.archived_at ? "Wiederherstellen" : "Archivieren"}
                  </button>
                  <button className="button" disabled={savingId === lead.id} onClick={() => void removeLead(lead)}>
                    Löschen
                  </button>
                </div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <small>Angebot: {proposalLabels[lead.proposal_status]}</small>
                  <small>Setup: {formatMoney(lead.setup_price_cents)}</small>
                  <small>MRR: {formatMoney(lead.monthly_price_cents)}</small>
                  {lead.customer_since && (
                    <small>Kunde seit: {new Date(lead.customer_since).toLocaleDateString("de-DE")}</small>
                  )}
                  {lead.last_contacted_at && (
                    <small>Letzter Kontakt: {new Date(lead.last_contacted_at).toLocaleString("de-DE")}</small>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="adminpanel">
          <div>
            <small>WEBSITES</small>
            <h2>Vorlagen & Demos</h2>
          </div>
          {Object.values(sites).map((site) => (
            <div className="adminrow" key={site.slug}>
              <span className="dot" />
              <div>
                <strong>{site.business}</strong>
                <small>{site.category}</small>
              </div>
              <b>Demo</b>
              <a href={`/demo/${site.slug}`}>Öffnen ↗</a>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
