"use client";

import { useEffect, useMemo, useState } from "react";
import type { Lead } from "@/lib/leads";
import type { CustomerProject } from "@/lib/projects";
import type { BillingSubscription, BillingSubscriptionStatus } from "@/lib/subscriptions";

const statusLabels: Record<BillingSubscriptionStatus, string> = {
  active: "Aktiv",
  paused: "Pausiert",
  past_due: "Zahlung offen",
  cancelled: "Gekündigt",
};

function money(cents: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export default function SubscriptionsAdmin() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [subscriptions, setSubscriptions] = useState<BillingSubscription[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<CustomerProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [leadId, setLeadId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [name, setName] = useState("Website Betreuung");
  const [amount, setAmount] = useState("99.00");
  const [taxPercent, setTaxPercent] = useState("19");
  const [nextInvoiceDate, setNextInvoiceDate] = useState(new Date().toISOString().slice(0, 10));

  const active = subscriptions.filter((item) => item.status === "active");
  const mrr = active.reduce((sum, item) => sum + item.amount_cents, 0);
  const pastDue = subscriptions.filter((item) => item.status === "past_due").length;
  const availableProjects = useMemo(() => projects.filter((project) => !leadId || project.lead_id === Number(leadId)), [projects, leadId]);

  useEffect(() => {
    const saved = sessionStorage.getItem("webforge_admin_password");
    if (saved) { setPassword(saved); void loadAll(saved); }
  }, []);

  async function post(path: string, body: Record<string, unknown>, candidate = password) {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: candidate, ...body }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "Aktion fehlgeschlagen.");
    return data;
  }

  async function loadAll(candidate = password) {
    setLoading(true); setError(""); setNotice("");
    try {
      const [subsData, leadsData, projectsData] = await Promise.all([
        post("/api/admin/subscriptions", { action: "list" }, candidate),
        post("/api/admin/leads", {}, candidate),
        post("/api/admin/projects", { action: "list" }, candidate),
      ]);
      setSubscriptions(subsData.subscriptions as BillingSubscription[]);
      setLeads(leadsData.leads as Lead[]);
      setProjects(projectsData.projects as CustomerProject[]);
      setAuthenticated(true);
      setPassword(candidate);
      sessionStorage.setItem("webforge_admin_password", candidate);
    } catch (err) {
      setAuthenticated(false);
      sessionStorage.removeItem("webforge_admin_password");
      setError(err instanceof Error ? err.message : "Anmeldung fehlgeschlagen.");
    } finally { setLoading(false); }
  }

  async function createSubscription() {
    const parsedLeadId = Number(leadId);
    const amountCents = Math.round((Number(amount.replace(",", ".")) || 0) * 100);
    const tax = Number(taxPercent.replace(",", "."));
    if (!parsedLeadId) { setError("Bitte Kunde auswählen."); return; }
    setLoading(true); setError(""); setNotice("");
    try {
      await post("/api/admin/subscriptions", {
        action: "create",
        leadId: parsedLeadId,
        projectId: projectId ? Number(projectId) : null,
        name,
        amountCents,
        taxPercent: tax,
        nextInvoiceDate,
      });
      setNotice("Monatliche Betreuung angelegt.");
      await loadAll();
    } catch (err) { setError(err instanceof Error ? err.message : "Abo konnte nicht erstellt werden."); }
    finally { setLoading(false); }
  }

  async function setStatus(subscriptionId: number, status: BillingSubscriptionStatus) {
    setBusyId(subscriptionId); setError(""); setNotice("");
    try {
      await post("/api/admin/subscriptions", { action: "status", subscriptionId, status });
      setSubscriptions((items) => items.map((item) => item.id === subscriptionId ? { ...item, status } : item));
    } catch (err) { setError(err instanceof Error ? err.message : "Status konnte nicht geändert werden."); }
    finally { setBusyId(null); }
  }

  async function generateDue() {
    setLoading(true); setError(""); setNotice("");
    try {
      const data = await post("/api/admin/subscriptions", { action: "generate" });
      const generated = data.generated as { invoice_number: string }[];
      setNotice(generated.length ? `${generated.length} Monatsrechnung(en) erzeugt: ${generated.map((item) => item.invoice_number).join(", ")}` : "Keine fälligen Monatsrechnungen.");
      await loadAll();
    } catch (err) { setError(err instanceof Error ? err.message : "Monatsrechnungen konnten nicht erzeugt werden."); }
    finally { setLoading(false); }
  }

  async function createStripeCheckout(subscriptionId: number) {
    setBusyId(subscriptionId); setError(""); setNotice("");
    try {
      const data = await post("/api/admin/subscriptions/stripe-checkout", { subscriptionId });
      window.open(String(data.url), "_blank", "noopener,noreferrer");
      setNotice("Stripe Checkout wurde geöffnet.");
      await loadAll();
    } catch (err) { setError(err instanceof Error ? err.message : "Stripe Checkout konnte nicht erstellt werden."); }
    finally { setBusyId(null); }
  }

  if (!authenticated) return <main className="admin"><aside><a className="brand" href="/"><span>W</span> WebForge</a></aside><section><div className="adminhead"><div><small>WEBFORGE BILLING</small><h1>Abos & MRR</h1></div><a className="button" href="/admin">CRM</a></div><div className="adminpanel"><h2>Admin Login</h2><form onSubmit={(event)=>{event.preventDefault();void loadAll();}} style={{display:"grid",gap:10,maxWidth:420}}><input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Adminpasswort" required/><button className="button" disabled={loading}>{loading?"Prüfe …":"Einloggen"}</button>{error&&<p>{error}</p>}</form></div></section></main>;

  return <main className="admin"><aside><a className="brand" href="/"><span>W</span> WebForge</a><nav><a href="/admin">CRM</a><a href="/admin/invoices">Rechnungen</a><b>Abos</b></nav></aside><section>
    <div className="adminhead"><div><small>RECURRING REVENUE</small><h1>Monatliche Betreuung</h1></div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button className="button" onClick={()=>void generateDue()} disabled={loading}>Fällige Rechnungen erzeugen</button><a className="button" href="/admin/invoices">Rechnungen</a></div></div>
    <div className="stats"><article><small>AKTIVE ABOS</small><strong>{active.length}</strong><span>monatlich</span></article><article><small>MRR</small><strong>{money(mrr)}</strong><span>netto</span></article><article><small>ZAHLUNG OFFEN</small><strong>{pastDue}</strong><span>Stripe/Manuell</span></article></div>
    {error&&<div className="adminpanel"><p>{error}</p></div>}{notice&&<div className="adminpanel"><p>{notice}</p></div>}
    <div className="adminpanel"><small>NEUE BETREUUNG</small><h2>Monatliches Abo anlegen</h2><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:8}}><select value={leadId} onChange={(e)=>{setLeadId(e.target.value);setProjectId("");}}><option value="">Kunde wählen</option>{leads.filter((lead)=>lead.status==="won").map((lead)=><option key={lead.id} value={lead.id}>{lead.company}</option>)}</select><select value={projectId} onChange={(e)=>setProjectId(e.target.value)}><option value="">Ohne Projekt</option>{availableProjects.map((project)=><option key={project.id} value={project.id}>{project.project_number} · {project.name}</option>)}</select><input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Leistung"/><input value={amount} onChange={(e)=>setAmount(e.target.value)} inputMode="decimal" placeholder="Netto / Monat €"/><input value={taxPercent} onChange={(e)=>setTaxPercent(e.target.value)} inputMode="decimal" placeholder="MwSt. %"/><label>Nächste Rechnung<input type="date" value={nextInvoiceDate} onChange={(e)=>setNextInvoiceDate(e.target.value)}/></label></div><button className="button" style={{marginTop:10}} onClick={()=>void createSubscription()} disabled={loading}>Betreuung anlegen</button></div>
    <div className="adminpanel"><small>ABOS</small><h2>{subscriptions.length} Verträge</h2>{subscriptions.length===0&&<p>Noch keine monatlichen Betreuungen.</p>}{subscriptions.map((subscription)=><div className="adminrow" key={subscription.id}><span className="dot"/><div><strong>{subscription.company} · {subscription.name}</strong><small>{money(subscription.amount_cents)} netto/Monat · nächste Rechnung {new Date(subscription.next_invoice_date+"T00:00:00").toLocaleDateString("de-DE")}{subscription.project_number?` · ${subscription.project_number}`:""}</small></div><select value={subscription.status} disabled={busyId===subscription.id} onChange={(e)=>void setStatus(subscription.id,e.target.value as BillingSubscriptionStatus)}>{Object.entries(statusLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{subscription.stripe_subscription_id?<b>Stripe aktiv</b>:<button className="button" disabled={busyId===subscription.id} onClick={()=>void createStripeCheckout(subscription.id)}>Stripe Checkout</button>}{subscription.stripe_checkout_url&&<a className="button" href={subscription.stripe_checkout_url} target="_blank" rel="noreferrer">Checkout öffnen</a>}</div></div>)}</div>
  </section></main>;
}
