"use client";

import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, AlertTriangle, Send, Receipt, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import type { Invoice, DashboardStats } from "@/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [statsRes, invRes] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/invoices?sort=due_date&dir=asc"),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (invRes.ok) setInvoices(await invRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
      if (res.ok) {
        const toast = await import("react-hot-toast");
        toast.default.success("Reminder sent");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(null);
    }
  }

  function formatCurrency(cents: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
  }

  function statusBadge(status: string) {
    const map: Record<string, string> = { paid: "paid", sent: "sent", overdue: "overdue", draft: "draft", cancelled: "inactive" };
    return <Badge variant={map[status] || "sent"}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-6 w-48 bg-slate-200 rounded animate-pulse mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  const now = new Date();
  const upcoming = invoices.filter((i) => i.status === "sent" && new Date(i.due_date) > now).slice(0, 5);
  const recentUnpaid = invoices.filter((i) => i.status !== "paid").slice(0, 5);

  return (
    <div className="min-h-screen">
      <div className="border-b border-slate-200 bg-white">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-500 mt-0.5">Your accounts receivable overview</p>
          </div>
          <Link href="/invoices">
            <Button variant="primary" size="sm">
              <Receipt className="w-4 h-4" />
              New Invoice
            </Button>
          </Link>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Outstanding</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats ? formatCurrency(stats.totalOutstanding) : "$0"}</p>
              <p className="text-sm text-slate-500 mt-1">Total outstanding AR</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">This Month</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats ? formatCurrency(stats.cashCollectedThisMonth) : "$0"}</p>
              <p className="text-sm text-slate-500 mt-1">Cash collected this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-red-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Overdue</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats?.overdueCount || 0}</p>
              <p className="text-sm text-slate-500 mt-1">Overdue invoices</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Receipt className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">Rate</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats?.collectionRate || 0}%</p>
              <p className="text-sm text-slate-500 mt-1">Collection rate</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Recent Unpaid Invoices</h2>
              <Link href="/invoices?status=sent" className="text-xs font-medium text-emerald-600 hover:text-emerald-700">View all</Link>
            </div>
            {recentUnpaid.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-slate-400">All invoices are paid</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentUnpaid.map((inv) => (
                  <div key={inv.id} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">{inv.client_name}</p>
                      <p className="text-xs text-slate-500">{formatCurrency(inv.amount_cents)} • Due {new Date(inv.due_date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      {statusBadge(inv.status)}
                      <button
                        onClick={() => sendNudge(inv.id)}
                        disabled={sending === inv.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                      >
                        <Send className={`w-3.5 h-3.5 ${sending === inv.id ? "animate-pulse" : ""}`} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Upcoming Due Dates</h2>
              <Link href="/invoices" className="text-xs font-medium text-emerald-600 hover:text-emerald-700">View all</Link>
            </div>
            {upcoming.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-slate-400">No upcoming invoices</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {upcoming.map((inv) => (
                  <div key={inv.id} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-amber-50 rounded-lg">
                        <Clock className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{inv.client_name}</p>
                        <p className="text-xs text-slate-500">{formatCurrency(inv.amount_cents)}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">{new Date(inv.due_date).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
