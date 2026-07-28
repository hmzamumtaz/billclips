"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import toast from "react-hot-toast";

export default function InvoicesPage() {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    client_name: "",
    client_email: "",
    amount: "",
    due_date: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.client_name || !form.client_email || !form.amount || !form.due_date) {
      toast.error("All fields are required");
      return;
    }

    const amountCents = Math.round(parseFloat(form.amount) * 100);
    if (isNaN(amountCents) || amountCents <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: form.client_name,
          client_email: form.client_email,
          amount_cents: amountCents,
          due_date: form.due_date,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create invoice");
      }

      toast.success("Invoice created successfully!");
      setForm({ client_name: "", client_email: "", amount: "", due_date: "" });
      setShowForm(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create invoice";
      toast.error(message);
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
        >
          {showForm ? (
            <>
              <X className="w-4 h-4" /> Cancel
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" /> New Invoice
            </>
          )}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-[var(--card-border)] p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Create New Invoice
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Client Name
                </label>
                <input
                  type="text"
                  name="client_name"
                  value={form.client_name}
                  onChange={handleChange}
                  placeholder="Acme Corp"
                  className="w-full px-3 py-2 border border-[var(--card-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Client Email
                </label>
                <input
                  type="email"
                  name="client_email"
                  value={form.client_email}
                  onChange={handleChange}
                  placeholder="billing@acme.com"
                  className="w-full px-3 py-2 border border-[var(--card-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Amount (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400">$</span>
                  <input
                    type="number"
                    name="amount"
                    value={form.amount}
                    onChange={handleChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full pl-7 pr-3 py-2 border border-[var(--card-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  name="due_date"
                  value={form.due_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-[var(--card-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-[var(--card-border)] rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? "Creating..." : "Create Invoice"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-[var(--card-border)] p-8 text-center">
        <p className="text-slate-400">
          {showForm
            ? "Fill out the form above to create a new invoice."
            : 'Click "New Invoice" to get started.'}
        </p>
      </div>
    </div>
  );
}
