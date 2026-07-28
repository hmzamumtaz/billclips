"use client";

import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, AlertTriangle, Send } from "lucide-react";
import toast from "react-hot-toast";
import type { Invoice, DashboardStats } from "@/types";

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalOutstanding: 0,
    cashCollectedThisMonth: 0,
    overdueCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  async function fetchInvoices() {
    try {
      const res = await fetch("/api/invoices");
      if (!res.ok) throw new Error("Failed to fetch");
      const data: Invoice[] = await res.json();
      setInvoices(data);
      computeStats(data);
    } catch (err) {
      toast.error("Failed to load invoices");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function computeStats(data: Invoice[]) {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const outstanding = data
      .filter((inv) => inv.status !== "paid")
      .reduce((sum, inv) => sum + inv.amount_cents, 0);

    const collected = data
      .filter((inv) => {
        const created = new Date(inv.created_at);
        return (
          inv.status === "paid" &&
          created.getMonth() === thisMonth &&
          created.getFullYear() === thisYear
        );
      })
      .reduce((sum, inv) => sum + inv.amount_cents, 0);

    const overdueCount = data.filter((inv) => inv.status === "overdue").length;

    setStats({
      totalOutstanding: outstanding,
      cashCollectedThisMonth: collected,
      overdueCount,
    });
  }

  async function sendNudge(invoiceId: string) {
    try {
      const res = await fetch("/api/send-nudge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });

      if (!res.ok) throw new Error("Failed to send nudge");

      toast.success("Reminder sent successfully!");
    } catch (err) {
      toast.error("Failed to send reminder");
      console.error(err);
    }
  }

  function formatCurrency(cents: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      paid: "bg-emerald-100 text-emerald-800",
      sent: "bg-amber-100 text-amber-800",
      overdue: "bg-red-100 text-red-800",
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          styles[status] || "bg-slate-100 text-slate-800"
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        Accounts Receivable Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-[var(--card-border)] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-sm text-slate-500 mb-1">Total Outstanding AR</p>
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(stats.totalOutstanding)}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[var(--card-border)] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-slate-500 mb-1">Cash Collected This Month</p>
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(stats.cashCollectedThisMonth)}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[var(--card-border)] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <p className="text-sm text-slate-500 mb-1">Overdue Invoices</p>
          <p className="text-2xl font-bold text-slate-900">
            {stats.overdueCount}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[var(--card-border)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--card-border)]">
          <h2 className="text-lg font-semibold text-slate-900">
            Active Invoices
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--card-border)]">
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Client Name
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {invoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-slate-400"
                  >
                    No invoices yet. Create your first invoice.
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {invoice.client_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {invoice.client_email}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {formatCurrency(invoice.amount_cents)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(invoice.due_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => sendNudge(invoice.id)}
                        disabled={invoice.status === "paid"}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--card-border)] text-slate-600 hover:bg-slate-50 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Send Nudge
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
