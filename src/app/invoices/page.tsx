"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Search, Filter, MoreHorizontal, Edit3, Trash2, Eye, Send, X } from "lucide-react";
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

  const fetchInvoices = useCallback(async () => {
    try {
      const params = new URLSearchParams({ sort: sortKey, dir: sortDir });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("q", search);

      const res = await fetch(`/api/invoices?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      setInvoices(await res.json());
    } catch (err) {
      toast.error("Failed to load invoices");
      console.error(err);
    } finally {
      setLoading(false);
    }
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

  function resetForm() {
    setForm({ client_name: "", client_email: "", client_phone: "", client_address: "", amount: "", due_date: "", notes: "" });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.client_name || !form.client_email || !form.amount || !form.due_date) {
      toast.error("All fields are required");
      return;
    }
    const amountCents = Math.round(parseFloat(form.amount) * 100);
    if (isNaN(amountCents) || amountCents <= 0) { toast.error("Invalid amount"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: form.client_name,
          client_email: form.client_email,
          client_phone: form.client_phone,
          client_address: form.client_address,
          amount_cents: amountCents,
          due_date: form.due_date,
          notes: form.notes,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      toast.success("Invoice created");
      setCreateOpen(false);
      resetForm();
      fetchInvoices();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedInvoice) return;
    const amountCents = Math.round(parseFloat(form.amount) * 100);
    if (isNaN(amountCents) || amountCents <= 0) { toast.error("Invalid amount"); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/invoices/${selectedInvoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: form.client_name,
          client_email: form.client_email,
          client_phone: form.client_phone,
          client_address: form.client_address,
          amount_cents: amountCents,
          due_date: form.due_date,
          notes: form.notes,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      toast.success("Invoice updated");
      setEditOpen(false);
      fetchInvoices();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!selectedInvoice) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/invoices/${selectedInvoice.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Invoice deleted");
      setDeleteOpen(false);
      fetchInvoices();
    } catch (err) {
      toast.error("Failed to delete");
    } finally {
      setSubmitting(false);
    }
  }

  async function sendNudge(invoiceId: string) {
    setSending(invoiceId);
    try {
      const res = await fetch("/api/send-nudge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });
      if (res.ok) toast.success("Reminder sent");
      else toast.error("Failed to send");
    } catch { toast.error("Failed to send"); }
    finally { setSending(null); }
  }

  function openEdit(inv: Invoice) {
    setSelectedInvoice(inv);
    setForm({
      client_name: inv.client_name,
      client_email: inv.client_email,
      client_phone: inv.client_phone || "",
      client_address: inv.client_address || "",
      amount: (inv.amount_cents / 100).toFixed(2),
      due_date: inv.due_date,
      notes: inv.notes || "",
    });
    setEditOpen(true);
  }

  function openDetail(inv: Invoice) {
    setSelectedInvoice(inv);
    setDetailOpen(true);
  }

  return (
    <div>
      <div className="border-b border-slate-200 bg-white">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Invoices</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage and track all your invoices</p>
          </div>
          <Button onClick={() => { resetForm(); setCreateOpen(true); }} size="sm">
            <Plus className="w-4 h-4" />
            New Invoice
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoices..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
        </div>

        <Card>
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-400">Loading...</div>
          ) : invoices.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No invoices yet"
                description="Create your first invoice to start tracking payments."
                action={{ label: "Create Invoice", onClick: () => { resetForm(); setCreateOpen(true); } }}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    {[
                      { key: "invoice_number", label: "Number", sortable: true },
                      { key: "client_name", label: "Client", sortable: true },
                      { key: "client_email", label: "Email" },
                      { key: "amount_cents", label: "Amount", sortable: true },
                      { key: "due_date", label: "Due Date", sortable: true },
                      { key: "status", label: "Status", sortable: true },
                      { key: "actions", label: "" },
                    ].map((col) => (
                      <th
                        key={col.key}
                        onClick={() => col.sortable && handleSort(col.key)}
                        className={`px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider ${col.sortable ? "cursor-pointer hover:text-slate-700 select-none" : ""}`}
                      >
                        {col.label}
                        {sortKey === col.key && <span className="ml-1 text-emerald-600">{sortDir === "asc" ? "↑" : "↓"}</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-slate-600">{inv.invoice_number || "—"}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => openDetail(inv)} className="text-sm font-medium text-slate-900 hover:text-emerald-600">{inv.client_name}</button>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">{inv.client_email}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{formatCurrency(inv.amount_cents)}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{new Date(inv.due_date).toLocaleDateString()}</td>
                      <td className="px-4 py-3">{statusBadge(inv.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openDetail(inv)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"><Eye className="w-3.5 h-3.5" /></button>
                          <button onClick={() => openEdit(inv)} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"><Edit3 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => sendNudge(inv.id)} disabled={sending === inv.id || inv.status === "paid"} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30"><Send className={`w-3.5 h-3.5 ${sending === inv.id ? "animate-pulse" : ""}`} /></button>
                          <button
                            onClick={() => { setSelectedInvoice(inv); setDeleteOpen(true); }}
                            disabled={inv.status === "paid"}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Invoice" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Client Name" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} placeholder="Acme Corp" required />
            <Input label="Client Email" type="email" value={form.client_email} onChange={(e) => setForm({ ...form, client_email: e.target.value })} placeholder="billing@acme.com" required />
            <Input label="Client Phone" value={form.client_phone} onChange={(e) => setForm({ ...form, client_phone: e.target.value })} placeholder="+1 (555) 000-0000" />
            <Input label="Amount (USD)" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" step="0.01" required />
            <Input label="Due Date" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} required />
          </div>
          <Input label="Client Address" value={form.client_address} onChange={(e) => setForm({ ...form, client_address: e.target.value })} placeholder="123 Main St, City" />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Optional notes..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Create Invoice</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Invoice" size="lg">
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Client Name" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} required />
            <Input label="Client Email" type="email" value={form.client_email} onChange={(e) => setForm({ ...form, client_email: e.target.value })} required />
            <Input label="Client Phone" value={form.client_phone} onChange={(e) => setForm({ ...form, client_phone: e.target.value })} />
            <Input label="Amount (USD)" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} step="0.01" required />
            <Input label="Due Date" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} required />
          </div>
          <Input label="Client Address" value={form.client_address} onChange={(e) => setForm({ ...form, client_address: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title="Invoice Details" size="lg">
        {selectedInvoice && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">Invoice #{selectedInvoice.invoice_number}</p>
                <p className="text-lg font-semibold text-slate-900 mt-1">{selectedInvoice.client_name}</p>
              </div>
              {statusBadge(selectedInvoice.status)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase">Client Email</p>
                <p className="text-sm text-slate-900">{selectedInvoice.client_email}</p>
              </div>
              {selectedInvoice.client_phone && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase">Phone</p>
                  <p className="text-sm text-slate-900">{selectedInvoice.client_phone}</p>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase">Amount</p>
                <p className="text-lg font-bold text-slate-900">{formatCurrency(selectedInvoice.amount_cents)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase">Due Date</p>
                <p className="text-sm text-slate-900">{new Date(selectedInvoice.due_date).toLocaleDateString()}</p>
              </div>
              {selectedInvoice.client_address && (
                <div className="space-y-1 col-span-2">
                  <p className="text-xs font-medium text-slate-500 uppercase">Address</p>
                  <p className="text-sm text-slate-900">{selectedInvoice.client_address}</p>
                </div>
              )}
              {selectedInvoice.notes && (
                <div className="space-y-1 col-span-2">
                  <p className="text-xs font-medium text-slate-500 uppercase">Notes</p>
                  <p className="text-sm text-slate-600">{selectedInvoice.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Invoice" size="sm">
        <p className="text-sm text-slate-600">Are you sure you want to delete this invoice? This action cannot be undone.</p>
        {selectedInvoice && (
          <p className="text-sm font-medium text-slate-900 mt-2">{selectedInvoice.client_name} — {formatCurrency(selectedInvoice.amount_cents)}</p>
        )}
        <div className="flex justify-end gap-3 pt-6">
          <Button variant="secondary" onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} loading={submitting}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
