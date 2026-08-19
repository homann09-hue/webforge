import { adminRpc } from "@/lib/admin-rpc";

export type InvoiceStatus = "draft" | "open" | "paid" | "overdue" | "void";
export type InvoiceType = "setup" | "monthly" | "custom";
export type PaymentMethod = "bank_transfer" | "cash" | "stripe" | "paypal" | "other";

export type InvoiceItem = {
  id: number;
  position: number;
  description: string;
  quantity: number;
  unit: string;
  unit_price_cents: number;
  line_total_cents: number;
};

export type InvoicePayment = {
  id: number;
  amount_cents: number;
  method: PaymentMethod;
  reference: string | null;
  paid_at: string;
};

export type Invoice = {
  id: number;
  lead_id: number;
  project_id: number | null;
  invoice_number: string;
  invoice_type: InvoiceType;
  title: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string | null;
  tax_percent: number;
  notes: string | null;
  company: string;
  contact_name: string | null;
  email: string;
  project_number: string | null;
  project_name: string | null;
  net_cents: number;
  tax_cents: number;
  gross_cents: number;
  paid_cents: number;
  balance_cents: number;
  created_at: string;
  items: InvoiceItem[];
  payments: InvoicePayment[];
};

export async function listInvoices(password: string): Promise<Invoice[]> {
  const response = await adminRpc("admin_list_invoices", { p_password: password });
  return (await response.json()) as Invoice[];
}

export async function createInvoice(password: string, input: {
  leadId: number; projectId?: number | null; invoiceType: InvoiceType; title: string; issueDate: string; dueDate: string; taxPercent: number; notes: string;
  items: { description: string; quantity: number; unit: string; unitPriceCents: number }[];
}) {
  const response = await adminRpc("admin_create_invoice", {
    p_password: password, p_lead_id: input.leadId, p_project_id: input.projectId || null, p_invoice_type: input.invoiceType,
    p_title: input.title, p_issue_date: input.issueDate || null, p_due_date: input.dueDate || null, p_tax_percent: input.taxPercent,
    p_notes: input.notes || null, p_items: input.items.map((item) => ({ description: item.description, quantity: item.quantity, unit: item.unit, unit_price_cents: item.unitPriceCents })),
  });
  return (await response.json()) as number;
}

export async function setInvoiceStatus(password: string, invoiceId: number, status: "draft" | "open" | "void") {
  await adminRpc("admin_set_invoice_status", { p_password: password, p_invoice_id: invoiceId, p_status: status });
}

export async function addPayment(password: string, invoiceId: number, amountCents: number, method: PaymentMethod, reference: string, paidAt: string) {
  await adminRpc("admin_add_payment", { p_password: password, p_invoice_id: invoiceId, p_amount_cents: amountCents, p_method: method, p_reference: reference || null, p_paid_at: paidAt || null });
}

export async function deleteInvoice(password: string, invoiceId: number) {
  await adminRpc("admin_delete_invoice", { p_password: password, p_invoice_id: invoiceId });
}
