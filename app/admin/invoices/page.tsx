"use client";

import { useEffect, useMemo, useState } from "react";
import type { Invoice, InvoiceStatus, InvoiceType, PaymentMethod } from "@/lib/billing";
import type { Lead } from "@/lib/leads";
import type { CustomerProject } from "@/lib/projects";

const statusLabels: Record<InvoiceStatus, string> = { draft: "Entwurf", open: "Offen", paid: "Bezahlt", overdue: "Überfällig", void: "Storniert" };
const typeLabels: Record<InvoiceType, string> = { setup: "Setup", monthly: "Monatlich", custom: "Einmalig" };
const methodLabels: Record<PaymentMethod, string> = { bank_transfer: "Überweisung", cash: "Bar", stripe: "Stripe", paypal: "PayPal", other: "Sonstiges" };

type ItemDraft = { description: string; quantity: string; unit: string; unitPrice: string };
type PaymentDraft = { amount: string; method: PaymentMethod; reference: string; paidAt: string };

function money(cents: number) { return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format((cents || 0) / 100); }
function esc(value: string) { return value.replace(/[&<>"']/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char] || char)); }
function today() { return new Date().toISOString().slice(0, 10); }
function addDays(date: string, days: number) { const value = new Date(`${date}T00:00:00`); value.setDate(value.getDate() + days); return value.toISOString().slice(0, 10); }
function newItem(): ItemDraft { return { description: "", quantity: "1", unit: "Stk.", unitPrice: "0.00" }; }

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
  const [taxPercent, setTaxPercent] = useState("19");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemDraft[]>([newItem()]);
  const [payments, setPayments] = useState<Record<number, PaymentDraft>>({});

  const visible = useMemo(() => invoices.filter((invoice) => {
    const matchesStatus = filter === "all" || invoice.status === filter;
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || [invoice.invoice_number, invoice.company, invoice.title, invoice.project_number || ""].some((value) => value.toLowerCase().includes(term));
    return matchesStatus && matchesSearch;
  }), [invoices, filter, search]);

  const totalInvoiced = invoices.filter((invoice) => invoice.status !== "void").reduce((sum, invoice) => sum + invoice.gross_cents, 0);
  const totalPaid = invoices.reduce((sum, invoice) => sum + invoice.paid_cents, 0);
  const outstanding = invoices.filter((invoice) => !["paid","void"].includes(invoice.status)).reduce((sum, invoice) => sum + invoice.balance_cents, 0);
  const overdue = invoices.filter((invoice) => invoice.status === "overdue").reduce((sum, invoice) => sum + invoice.balance_cents, 0);

  useEffect(() => {
    const saved = sessionStorage.getItem("webforge_admin_password");
    if (saved) { setPassword(saved); void loadAll(saved); }
  }, []);

  async function post(path: string, body: Record<string, unknown>, candidate = password) {
    const response = await fetch(path, { method: "POST", headers: { "Content-Type":"application/json" }, body: JSON.stringify({ password: candidate, ...body }) });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "Aktion fehlgeschlagen.");
    return data;
  }

  async function loadAll(candidate = password) {
    setLoading(true); setError("");
    try {
      const [invoiceData, leadData, projectData] = await Promise.all([
        post("/api/admin/invoices", { action: "list" }, candidate),
        post("/api/admin/leads", {}, candidate),
        post("/api/admin/projects", { action: "list" }, candidate),
      ]);
      setInvoices(invoiceData.invoices as Invoice[]);
      setLeads(leadData.leads as Lead[]);
      setProjects(projectData.projects as CustomerProject[]);
      setAuthenticated(true); setPassword(candidate); sessionStorage.setItem("webforge_admin_password", candidate);
    } catch (err) {
      setAuthenticated(false); sessionStorage.removeItem("webforge_admin_password"); setError(err instanceof Error ? err.message : "Anmeldung fehlgeschlagen.");
    } finally { setLoading(false); }
  }

  function selectProject(value: string) {
    setProjectId(value);
    const project = projects.find((item) => String(item.id) === value);
    if (project) setLeadId(String(project.lead_id));
  }

  async function createNewInvoice() {
    if (!leadId) { setError("Bitte zuerst einen Kunden auswählen."); return; }
    setLoading(true); setError("");
    try {
      const payloadItems = items.map((item) => ({
        description: item.description.trim(), quantity: Number(item.quantity.replace(",",".")), unit: item.unit.trim() || "Stk.",
        unitPriceCents: Math.round((Number(item.unitPrice.replace(",",".")) || 0) * 100),
      }));
      await post("/api/admin/invoices", { action:"create", leadId:Number(leadId), projectId:projectId ? Number(projectId) : null, invoiceType, title, issueDate, dueDate, taxPercent:Number(taxPercent.replace(",",".")), notes, items:payloadItems });
      setItems([newItem()]); setNotes(""); await loadAll();
    } catch (err) { setError(err instanceof Error ? err.message : "Rechnung konnte nicht erstellt werden."); }
    finally { setLoading(false); }
  }

  async function changeStatus(invoiceId: number, status: "draft" | "open" | "void") {
    setError("");
    try { await post("/api/admin/invoices", { action:"status", invoiceId, status }); await loadAll(); }
    catch (err) { setError(err instanceof Error ? err.message : "Status konnte nicht gespeichert werden."); }
  }

  async function recordPayment(invoice: Invoice) {
    const draft = payments[invoice.id] || { amount:(invoice.balance_cents/100).toFixed(2), method:"bank_transfer" as PaymentMethod, reference:"", paidAt:new Date().toISOString().slice(0,16) };
    const amountCents = Math.round((Number(draft.amount.replace(",",".")) || 0) * 100);
    setError("");
    try { await post("/api/admin/invoices", { action:"payment", invoiceId:invoice.id, amountCents, method:draft.method, reference:draft.reference, paidAt:draft.paidAt ? new Date(draft.paidAt).toISOString() : "" }); await loadAll(); }
    catch (err) { setError(err instanceof Error ? err.message : "Zahlung konnte nicht gespeichert werden."); }
  }

  async function removeInvoice(invoice: Invoice) {
    if (!confirm(`Rechnung ${invoice.invoice_number} löschen? Nur Entwürfe ohne Zahlung können gelöscht werden.`)) return;
    try { await post("/api/admin/invoices", { action:"delete", invoiceId:invoice.id }); await loadAll(); }
    catch (err) { setError(err instanceof Error ? err.message : "Rechnung konnte nicht gelöscht werden."); }
  }

  function printInvoice(invoice: Invoice) {
    const rows = invoice.items.map((item) => `<tr><td>${item.position}</td><td>${esc(item.description)}</td><td>${item.quantity} ${esc(item.unit)}</td><td style="text-align:right">${money(item.unit_price_cents)}</td><td style="text-align:right">${money(item.line_total_cents)}</td></tr>`).join("");
    const win = window.open("", "_blank", "width=900,height=1000");
    if (!win) return;
    win.document.write(`<!doctype html><html><head><title>${esc(invoice.invoice_number)}</title><style>body{font-family:Arial,sans-serif;color:#111;padding:48px;max-width:850px;margin:auto}header{display:flex;justify-content:space-between;margin-bottom:48px}h1{font-size:34px;margin:0}table{width:100%;border-collapse:collapse;margin-top:28px}th,td{padding:10px;border-bottom:1px solid #ddd;text-align:left}.totals{margin-left:auto;width:320px;margin-top:24px}.totals div{display:flex;justify-content:space-between;padding:6px 0}.gross{font-weight:700;font-size:18px}.muted{color:#666} @media print{button{display:none}}</style></head><body><header><div><h1>WebForge</h1><div class="muted">Webdesign & digitale Lösungen</div></div><div><strong>Rechnung ${esc(invoice.invoice_number)}</strong><br>Datum: ${new Date(invoice.issue_date+"T00:00:00").toLocaleDateString("de-DE")}<br>${invoice.due_date ? `Fällig: ${new Date(invoice.due_date+"T00:00:00").toLocaleDateString("de-DE")}` : ""}</div></header><section><strong>${esc(invoice.company)}</strong>${invoice.contact_name ? `<br>${esc(invoice.contact_name)}` : ""}<br>${esc(invoice.email)}</section><h2>${esc(invoice.title)}</h2><table><thead><tr><th>#</th><th>Leistung</th><th>Menge</th><th style="text-align:right">Einzelpreis</th><th style="text-align:right">Gesamt</th></tr></thead><tbody>${rows}</tbody></table><div class="totals"><div><span>Netto</span><span>${money(invoice.net_cents)}</span></div><div><span>MwSt. ${invoice.tax_percent}%</span><span>${money(invoice.tax_cents)}</span></div><div class="gross"><span>Gesamt</span><span>${money(invoice.gross_cents)}</span></div><div><span>Bezahlt</span><span>${money(invoice.paid_cents)}</span></div><div class="gross"><span>Offen</span><span>${money(invoice.balance_cents)}</span></div></div>${invoice.notes ? `<p style="margin-top:36px">${esc(invoice.notes)}</p>` : ""}<button onclick="window.print()" style="margin-top:40px;padding:12px 18px">Drucken / als PDF speichern</button></body></html>`);
    win.document.close();
  }

  if (!authenticated) return <main className="admin"><aside><a className="brand" href="/"><span>W</span> WebForge</a></aside><section><div className="adminhead"><div><small>WEBFORGE FINANCE</small><h1>Rechnungen</h1></div><a className="button" href="/admin">CRM</a></div><div className="adminpanel"><h2>Admin Login</h2><form onSubmit={(e)=>{e.preventDefault();void loadAll();}} style={{display:"grid",gap:10,maxWidth:420}}><input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Adminpasswort" required/><button className="button" disabled={loading}>{loading?"Prüfe …":"Einloggen"}</button>{error&&<p>{error}</p>}</form></div></section></main>;

  return <main className="admin"><aside><a className="brand" href="/"><span>W</span> WebForge</a><nav><a href="/admin">CRM</a><a href="/admin/projects">Projekte</a><b>Rechnungen</b></nav></aside><section>
    <div className="adminhead"><div><small>FINANCE CONTROL</small><h1>Rechnungen & Zahlungen</h1></div><button className="button" onClick={()=>void loadAll()} disabled={loading}>{loading?"Lädt …":"Aktualisieren"}</button></div>
    <div className="stats"><article><small>FAKTURIERT</small><strong>{money(totalInvoiced)}</strong><span>ohne Storno</span></article><article><small>BEZAHLT</small><strong>{money(totalPaid)}</strong><span>Zahlungseingänge</span></article><article><small>OFFEN</small><strong>{money(outstanding)}</strong><span>noch einzuziehen</span></article><article><small>ÜBERFÄLLIG</small><strong>{money(overdue)}</strong><span>Handlungsbedarf</span></article></div>

    <div className="adminpanel"><div><small>NEUE RECHNUNG</small><h2>Rechnung erstellen</h2></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:8}}><select value={leadId} onChange={(e)=>setLeadId(e.target.value)}><option value="">Kunde wählen</option>{leads.filter((lead)=>lead.status==="won").map((lead)=><option key={lead.id} value={lead.id}>{lead.company}</option>)}</select><select value={projectId} onChange={(e)=>selectProject(e.target.value)}><option value="">Kein Projekt</option>{projects.map((project)=><option key={project.id} value={project.id}>{project.project_number} · {project.company}</option>)}</select><select value={invoiceType} onChange={(e)=>setInvoiceType(e.target.value as InvoiceType)}>{Object.entries(typeLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select><input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Rechnungstitel"/><label>Rechnungsdatum<input type="date" value={issueDate} onChange={(e)=>setIssueDate(e.target.value)}/></label><label>Fällig am<input type="date" value={dueDate} onChange={(e)=>setDueDate(e.target.value)}/></label><input value={taxPercent} onChange={(e)=>setTaxPercent(e.target.value)} inputMode="decimal" placeholder="MwSt. %"/></div>
    <div style={{marginTop:14,display:"grid",gap:8}}>{items.map((item,index)=><div key={index} style={{display:"grid",gridTemplateColumns:"2fr .7fr .7fr 1fr auto",gap:8}}><input value={item.description} onChange={(e)=>setItems((current)=>current.map((row,i)=>i===index?{...row,description:e.target.value}:row))} placeholder="Leistung"/><input value={item.quantity} onChange={(e)=>setItems((current)=>current.map((row,i)=>i===index?{...row,quantity:e.target.value}:row))} placeholder="Menge"/><input value={item.unit} onChange={(e)=>setItems((current)=>current.map((row,i)=>i===index?{...row,unit:e.target.value}:row))} placeholder="Einheit"/><input value={item.unitPrice} onChange={(e)=>setItems((current)=>current.map((row,i)=>i===index?{...row,unitPrice:e.target.value}:row))} placeholder="Preis €"/><button className="button" onClick={()=>setItems((current)=>current.filter((_,i)=>i!==index))} disabled={items.length===1}>×</button></div>)}</div><div style={{display:"flex",gap:8,marginTop:10}}><button className="button" onClick={()=>setItems((current)=>[...current,newItem()])}>Position hinzufügen</button><button className="button" onClick={()=>void createNewInvoice()} disabled={loading}>Rechnung anlegen</button></div><textarea rows={2} value={notes} onChange={(e)=>setNotes(e.target.value)} placeholder="Zahlungshinweise / interne Notiz" style={{marginTop:10}}/></div>

    <div className="adminpanel"><div><small>FILTER</small><h2>Rechnungen finden</h2></div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Nummer, Kunde, Projekt …"/><select value={filter} onChange={(e)=>setFilter(e.target.value as "all"|InvoiceStatus)}><option value="all">Alle Status</option>{Object.entries(statusLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></div></div>

    <div className="adminpanel"><div><small>RECHNUNGEN</small><h2>{visible.length} Einträge</h2></div>{error&&<p>{error}</p>}{visible.length===0&&<p>Noch keine Rechnungen vorhanden.</p>}{visible.map((invoice)=>{const draft=payments[invoice.id]||{amount:(invoice.balance_cents/100).toFixed(2),method:"bank_transfer" as PaymentMethod,reference:"",paidAt:new Date().toISOString().slice(0,16)};return <div key={invoice.id} style={{padding:"20px 0",borderBottom:"1px solid rgba(255,255,255,.08)",display:"grid",gap:10}}><div className="adminrow"><span className="dot"/><div><strong>{invoice.invoice_number} · {invoice.company}</strong><small>{typeLabels[invoice.invoice_type]} · {invoice.title}{invoice.project_number?` · ${invoice.project_number}`:""}</small></div><b>{statusLabels[invoice.status]}</b><strong>{money(invoice.gross_cents)}</strong></div><div style={{display:"flex",gap:16,flexWrap:"wrap"}}><small>Netto {money(invoice.net_cents)}</small><small>Bezahlt {money(invoice.paid_cents)}</small><small>Offen {money(invoice.balance_cents)}</small><small>Ausgestellt {new Date(invoice.issue_date+"T00:00:00").toLocaleDateString("de-DE")}</small>{invoice.due_date&&<small>Fällig {new Date(invoice.due_date+"T00:00:00").toLocaleDateString("de-DE")}</small>}</div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button className="button" onClick={()=>printInvoice(invoice)}>Drucken / PDF</button>{invoice.status==="draft"&&<button className="button" onClick={()=>void changeStatus(invoice.id,"open")}>Als offen stellen</button>}{!(["paid","void"] as InvoiceStatus[]).includes(invoice.status)&&<button className="button" onClick={()=>void changeStatus(invoice.id,"void")}>Stornieren</button>}{invoice.status==="draft"&&<button className="button" onClick={()=>void removeInvoice(invoice)}>Entwurf löschen</button>}</div>{invoice.status!=="void"&&invoice.balance_cents>0&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1.2fr auto",gap:8}}><input value={draft.amount} onChange={(e)=>setPayments((current)=>({...current,[invoice.id]:{...draft,amount:e.target.value}}))} placeholder="Betrag €"/><select value={draft.method} onChange={(e)=>setPayments((current)=>({...current,[invoice.id]:{...draft,method:e.target.value as PaymentMethod}}))}>{Object.entries(methodLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select><input type="datetime-local" value={draft.paidAt} onChange={(e)=>setPayments((current)=>({...current,[invoice.id]:{...draft,paidAt:e.target.value}}))}/><input value={draft.reference} onChange={(e)=>setPayments((current)=>({...current,[invoice.id]:{...draft,reference:e.target.value}}))} placeholder="Referenz / Verwendungszweck"/><button className="button" onClick={()=>void recordPayment(invoice)}>Zahlung buchen</button></div>}{invoice.payments.length>0&&<div>{invoice.payments.map((payment)=><small key={payment.id} style={{display:"block"}}>Zahlung {money(payment.amount_cents)} · {methodLabels[payment.method]} · {new Date(payment.paid_at).toLocaleString("de-DE")}{payment.reference?` · ${payment.reference}`:""}</small>)}</div>}</div>})}</div>
  </section></main>;
}
