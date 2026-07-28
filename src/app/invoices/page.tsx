"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Search, Filter, MoreHorizontal, Edit3, Trash2, Eye, Send, X, Database } from "lucide-react";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Invoice } from "@/types";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [form, setForm] = useState({ client_name: "", client_email: "", client_phone: "", client_address: "", amount: "", due_date: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const fetchInvoices = useCallback(async () => {
    try {
      const params = new URLSearchParams({ sort: sortKey, dir: sortDir });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("q", search);
      const res = await fetch(`/api/invoices?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      setInvoices(await res.json());
    } catch (err) { toast.error("Failed to load invoices"); console.error(err); }
    finally { setLoading(false); }
  }, [search, statusFilter, sortKey, sortDir]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  function handleSort(key: string) {
    if (key === sortKey) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  function formatCurrency(cents: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
  }

  function statusBadge(status: string) {
    const map: Record<string, string> = { paid: "paid", sent: "sent", overdue: "overdue", draft: "draft", cancelled: "inactive" };
    return <Badge variant={map[status] || "sent"}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  }

  function resetForm() { setForm({ client_name: "", client_email: "", client_phone: "", client_address: "", amount: "", due_date: "", notes: "" }); }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.client_name || !form.client_email || !form.amount || !form.due_date) { toast.error("All fields are required"); return; }
    const amountCents = Math.round(parseFloat(form.amount) * 100);
    if (isNaN(amountCents) || amountCents <= 0) { toast.error("Invalid amount"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/invoices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ client_name: form.client_name, client_email: form.client_email, client_phone: form.client_phone, client_address: form.client_address, amount_cents: amountCents, due_date: form.due_date, notes: form.notes }) });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      toast.success("Invoice created"); setCreateOpen(false); resetForm(); fetchInvoices();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to create"); }
    finally { setSubmitting(false); }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault(); if (!selectedInvoice) return;
    const amountCents = Math.round(parseFloat(form.amount) * 100);
    if (isNaN(amountCents) || amountCents <= 0) { toast.error("Invalid amount"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/invoices/${selectedInvoice.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ client_name: form.client_name, client_email: form.client_email, client_phone: form.client_phone, client_address: form.client_address, amount_cents: amountCents, due_date: form.due_date, notes: form.notes }) });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      toast.success("Invoice updated"); setEditOpen(false); fetchInvoices();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to update"); }
    finally { setSubmitting(false); }
  }

  async function handleDelete() {
    if (!selectedInvoice) return; setSubmitting(true);
    try { const res = await fetch(`/api/invoices/${selectedInvoice.id}`, { method: "DELETE" }); if (!res.ok) throw new Error("Failed"); toast.success("Invoice deleted"); setDeleteOpen(false); fetchInvoices(); }
    catch { toast.error("Failed to delete"); }
    finally { setSubmitting(false); }
  }

  async function sendNudge(invoiceId: string) {
    setSending(invoiceId);
    try { const res = await fetch("/api/send-nudge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ invoiceId }) }); if (res.ok) toast.success("Reminder sent"); else toast.error("Failed"); }
    catch { toast.error("Failed"); }
    finally { setSending(null); }
  }

  async function seedSampleData() {
    setSeeding(true);
    try { const res = await fetch("/api/seed", { method: "POST" }); const data = await res.json(); if (res.ok) { toast.success(data.message); fetchInvoices(); } else toast.error(data.error); }
    catch { toast.error("Failed to seed data"); }
    finally { setSeeding(false); }
  }

  function openEdit(inv: Invoice) {
    setSelectedInvoice(inv); setForm({ client_name: inv.client_name, client_email: inv.client_email, client_phone: inv.client_phone || "", client_address: inv.client_address || "", amount: (inv.amount_cents / 100).toFixed(2), due_date: inv.due_date, notes: inv.notes || "" }); setEditOpen(true);
  }

  return (
    <div className="animate-fade-in">
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[var(--fg)]">Invoices</h1>
            <p className="text-sm text-[var(--fg-muted)] mt-0.5">Manage and track all your invoices</p>
          </div>
          <Button onClick={() => { resetForm(); setCreateOpen(true); }} size="sm">
            <Plus className="w-4 h-4" />
            New Invoice
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fg-muted)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoices..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-[var(--radius-sm)] bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: "all", label: "All Status" },
              { value: "draft", label: "Draft" },
              { value: "sent", label: "Sent" },
              { value: "paid", label: "Paid" },
              { value: "overdue", label: "Overdue" },
              { value: "cancelled", label: "Cancelled" },
            ]}
            className="w-40"
          />
          <p className="text-xs text-[var(--fg-muted)] ml-auto">{invoices.length} invoice{invoices.length !== 1 ? "s" : ""}</p>
        </div>

        <Card>
          {loading ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-slate-200">
                  {["Number", "Client", "Email", "Amount", "Due Date", "Status", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3.5"><div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: `${40 + Math.random() * 50}%` }} /></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-6">
              <EmptyState title="No invoices yet" description="Create an invoice manually or seed sample data to explore." action={{ label: "Create Invoice", onClick: () => { resetForm(); setCreateOpen(true); } }}><Button variant="ghost" size="sm" loading={seeding} onClick={seedSampleData}><Database className="w-3.5 h-3.5" />Seed sample data</Button></EmptyState>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    {[
                      { key: "invoice_number", label: "Number", sortable: true },
                      { key: "client_name", label: "Client", sortable: true },
                      { key: "client_email", label: "Email" },
                      { key: "amount_cents", label: "Amount", sortable: true },
                      { key: "due_date", label: "Due Date", sortable: true },
                      { key: "status", label: "Status", sortable: true },
                      { key: "actions", label: "" },
                    ].map((col) => (
                      <th key={col.key} onClick={() => col.sortable && handleSort(col.key)}
                        className={`text-left px-4 py-3.5 text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider ${col.sortable ? "cursor-pointer hover:text-[var(--fg)] select-none" : ""}`}>
                        <span className="inline-flex items-center gap-1.5">
                          {col.label}
                          {col.sortable && (
                            <span className={`inline-flex flex-col leading-none text-[10px] ${sortKey === col.key ? "text-emerald-600" : "text-slate-300"}`}>
                              <span className={sortKey === col.key && sortDir === "asc" ? "text-emerald-600" : ""}>▲</span>
                              <span className={sortKey === col.key && sortDir === "desc" ? "text-emerald-600" : ""}>▼</span>
                            </span>
                          )}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-emerald-50/40 transition-colors duration-100">
                      <td className="px-4 py-3.5 text-sm font-mono text-[var(--fg-muted)]">{inv.invoice_number || "—"}</td>
                      <td className="px-4 py-3.5">
                        <button onClick={() => { setSelectedInvoice(inv); setDetailOpen(true); }} className="text-sm font-medium text-[var(--fg)] hover:text-emerald-600 transition-colors">{inv.client_name}</button>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-[var(--fg-muted)]">{inv.client_email}</td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-[var(--fg)]">{formatCurrency(inv.amount_cents)}</td>
                      <td className="px-4 py-3.5 text-sm text-[var(--fg-muted)]">{new Date(inv.due_date).toLocaleDateString()}</td>
                      <td className="px-4 py-3.5">{statusBadge(inv.status)}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-0.5">
                          <button onClick={() => { setSelectedInvoice(inv); setDetailOpen(true); }} className="p-1.5 rounded-lg text-[var(--fg-muted)] hover:text-slate-600 hover:bg-slate-100 transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                          <button onClick={() => openEdit(inv)} className="p-1.5 rounded-lg text-[var(--fg-muted)] hover:text-emerald-600 hover:bg-emerald-50 transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => sendNudge(inv.id)} disabled={sending === inv.id || inv.status === "paid"} className="p-1.5 rounded-lg text-[var(--fg-muted)] hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 transition-colors"><Send className={`w-3.5 h-3.5 ${sending === inv.id ? "animate-pulse" : ""}`} /></button>
                          <button onClick={() => { setSelectedInvoice(inv); setDeleteOpen(true); }} disabled={inv.status === "paid"} className="p-1.5 rounded-lg text-[var(--fg-muted)] hover:text-red-600 hover:bg-red-50 disabled:opacity-30 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Invoice" size="lg">
        <form onSubmit={handleCreate} className="space-y-6">
          <div className="bg-blue-50/60 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-900">Client Information</p>
                <p className="text-xs text-blue-600">Who is this invoice for?</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Client Name" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} placeholder="e.g. Acme Corp" required />
              <Input label="Client Email" type="email" value={form.client_email} onChange={(e) => setForm({ ...form, client_email: e.target.value })} placeholder="e.g. billing@acme.com" required />
              <Input label="Phone (optional)" value={form.client_phone} onChange={(e) => setForm({ ...form, client_phone: e.target.value })} placeholder="e.g. +1 (555) 000-0000" />
              <Input label="Address (optional)" value={form.client_address} onChange={(e) => setForm({ ...form, client_address: e.target.value })} placeholder="e.g. 123 Main St, City" />
            </div>
          </div>

          <div className="bg-emerald-50/60 rounded-xl p-4 border border-emerald-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-900">Invoice Details</p>
                <p className="text-xs text-emerald-600">Amount, due date, and notes</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Amount (USD)" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" step="0.01" required hint="Enter the total amount" />
              <Input label="Due Date" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} required hint="When payment is expected" />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-[var(--fg)] mb-1.5">Notes (optional)</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="block w-full rounded-[var(--radius-sm)] border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" placeholder="Any additional details for this invoice…" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}><Plus className="w-4 h-4" />Create Invoice</Button>
          </div>
        </form>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Invoice" size="lg">
        <form onSubmit={handleEdit} className="space-y-6">
          <div className="bg-blue-50/60 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-900">Client Information</p>
                <p className="text-xs text-blue-600">Update client details</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Client Name" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} required />
              <Input label="Client Email" type="email" value={form.client_email} onChange={(e) => setForm({ ...form, client_email: e.target.value })} required />
              <Input label="Phone" value={form.client_phone} onChange={(e) => setForm({ ...form, client_phone: e.target.value })} />
              <Input label="Address" value={form.client_address} onChange={(e) => setForm({ ...form, client_address: e.target.value })} />
            </div>
          </div>

          <div className="bg-emerald-50/60 rounded-xl p-4 border border-emerald-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-900">Invoice Details</p>
                <p className="text-xs text-emerald-600">Amount, due date, and notes</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Amount (USD)" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} step="0.01" required />
              <Input label="Due Date" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} required />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-[var(--fg)] mb-1.5">Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="block w-full rounded-[var(--radius-sm)] border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Save Changes</Button>
          </div>
        </form>
      </Modal>

      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title="Invoice Details" size="lg">
        {selectedInvoice && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wider">Invoice #{selectedInvoice.invoice_number}</p>
                <p className="text-lg font-semibold text-[var(--fg)] mt-1">{selectedInvoice.client_name}</p>
              </div>
              {statusBadge(selectedInvoice.status)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wider">Email</p>
                <p className="text-sm text-[var(--fg)]">{selectedInvoice.client_email}</p>
              </div>
              {selectedInvoice.client_phone && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wider">Phone</p>
                  <p className="text-sm text-[var(--fg)]">{selectedInvoice.client_phone}</p>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wider">Amount</p>
                <p className="text-xl font-bold text-[var(--fg)]">{formatCurrency(selectedInvoice.amount_cents)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wider">Due Date</p>
                <p className="text-sm text-[var(--fg)]">{new Date(selectedInvoice.due_date).toLocaleDateString()}</p>
              </div>
              {selectedInvoice.client_address && (
                <div className="space-y-1 col-span-2">
                  <p className="text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wider">Address</p>
                  <p className="text-sm text-[var(--fg)]">{selectedInvoice.client_address}</p>
                </div>
              )}
              {selectedInvoice.notes && (
                <div className="space-y-1 col-span-2">
                  <p className="text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wider">Notes</p>
                  <p className="text-sm text-[var(--fg-muted)]">{selectedInvoice.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Invoice" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-[var(--fg-muted)]">Are you sure you want to delete this invoice? This action cannot be undone.</p>
          {selectedInvoice && (
            <div className="bg-red-50 rounded-lg p-3 border border-red-100">
              <p className="text-sm font-medium text-red-800">{selectedInvoice.client_name}</p>
              <p className="text-xs text-red-600 mt-0.5">{formatCurrency(selectedInvoice.amount_cents)}</p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} loading={submitting}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
