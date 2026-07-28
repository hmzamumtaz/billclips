"use client";

import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, AlertTriangle, Send, Receipt, ArrowUpRight, ArrowDownRight, Clock, Plus } from "lucide-react";
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

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      const [statsRes, invRes] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/invoices?sort=due_date&dir=asc"),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (invRes.ok) setInvoices(await invRes.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function sendNudge(invoiceId: string) {
    setSending(invoiceId);
    try {
      const res = await fetch("/api/send-nudge", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });
      if (res.ok) (await import("react-hot-toast")).default.success("Reminder sent");
    } catch (err) { console.error(err); }
    finally { setSending(null); }
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
    <div className="min-h-screen animate-fade-in">
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[var(--fg)]">Dashboard</h1>
            <p className="text-sm text-[var(--fg-muted)] mt-0.5">Your accounts receivable overview</p>
          </div>
          <Link href="/invoices">
            <Button variant="primary" size="sm">
              <Plus className="w-4 h-4" />
              New Invoice
            </Button>
          </Link>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Outstanding", value: stats ? formatCurrency(stats.totalOutstanding) : "$0", sub: "Total outstanding AR", icon: DollarSign, iconBg: "bg-emerald-50", iconColor: "text-emerald-600", badgeBg: "bg-emerald-50", badgeColor: "text-emerald-600", badge: "Outstanding" },
            { label: "Collected This Month", value: stats ? formatCurrency(stats.cashCollectedThisMonth) : "$0", sub: "Cash collected this month", icon: TrendingUp, iconBg: "bg-blue-50", iconColor: "text-blue-600", badgeBg: "bg-blue-50", badgeColor: "text-blue-600", badge: "This Month" },
            { label: "Overdue Invoices", value: String(stats?.overdueCount || 0), sub: "Overdue invoices", icon: AlertTriangle, iconBg: "bg-red-50", iconColor: "text-red-600", badgeBg: "bg-red-50", badgeColor: "text-red-600", badge: "Overdue" },
            { label: "Collection Rate", value: `${stats?.collectionRate || 0}%`, sub: "Collection rate", icon: Receipt, iconBg: "bg-purple-50", iconColor: "text-purple-600", badgeBg: "bg-purple-50", badgeColor: "text-purple-600", badge: "Rate" },
          ].map((item) => (
            <Card key={item.label}>
              <CardContent>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 ${item.iconBg} rounded-xl`}>
                    <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                  </div>
                  <span className={`text-xs font-medium ${item.badgeColor} ${item.badgeBg} px-2.5 py-0.5 rounded-full`}>{item.badge}</span>
                </div>
                <p className="text-2xl font-bold text-[var(--fg)]">{item.value}</p>
                <p className="text-sm text-[var(--fg-muted)] mt-1">{item.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--fg)]">Recent Unpaid</h2>
              <Link href="/invoices?status=sent" className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors">View all →</Link>
            </div>
            {recentUnpaid.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-[var(--fg-muted)]">All invoices are paid</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentUnpaid.map((inv) => (
                  <div key={inv.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-emerald-50/30 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--fg)] truncate">{inv.client_name}</p>
                      <p className="text-xs text-[var(--fg-muted)] mt-0.5">{formatCurrency(inv.amount_cents)}<span className="mx-1.5">·</span>Due {new Date(inv.due_date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      {statusBadge(inv.status)}
                      <button
                        onClick={() => sendNudge(inv.id)}
                        disabled={sending === inv.id}
                        className="p-2 rounded-lg text-[var(--fg-muted)] hover:text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
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
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--fg)]">Upcoming Due Dates</h2>
              <Link href="/invoices" className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors">View all →</Link>
            </div>
            {upcoming.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-[var(--fg-muted)]">No upcoming invoices</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {upcoming.map((inv) => (
                  <div key={inv.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-emerald-50/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-50 rounded-lg shrink-0">
                        <Clock className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--fg)]">{inv.client_name}</p>
                        <p className="text-xs text-[var(--fg-muted)] mt-0.5">{formatCurrency(inv.amount_cents)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-[var(--fg)]">{new Date(inv.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                    </div>
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
