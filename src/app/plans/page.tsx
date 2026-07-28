"use client";

import { useEffect, useState } from "react";
import { Check, Zap, Building2, Sparkles, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { Plan } from "@/types";

const iconMap: Record<string, React.ReactNode> = {
  free: <Sparkles className="w-6 h-6 text-slate-600" />,
  pro: <Zap className="w-6 h-6 text-emerald-600" />,
  enterprise: <Building2 className="w-6 h-6 text-purple-600" />,
};

const colorMap: Record<string, string> = {
  free: "ring-slate-200",
  pro: "ring-emerald-500 ring-2 shadow-lg shadow-emerald-200/50",
  enterprise: "ring-purple-500 ring-2",
};

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [yearly, setYearly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/plans")
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to load plans");
        }
        return res.json();
      })
      .then((data) => { setPlans(data); setError(""); })
      .catch((err) => { console.error(err); setError(err.message); setPlans([]); })
      .finally(() => setLoading(false));
  }, []);

  function formatPrice(cents: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(cents / 100);
  }

  return (
    <div>
      <div className="border-b border-slate-200 bg-white">
        <div className="px-6 py-4 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Simple, transparent pricing</h1>
          <p className="text-sm text-slate-500 mt-1">Pay via Paddle — works worldwide including Pakistan</p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <span className={`text-sm font-medium ${!yearly ? "text-slate-900" : "text-slate-500"}`}>Monthly</span>
            <button
              onClick={() => setYearly(!yearly)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${yearly ? "bg-emerald-600" : "bg-slate-300"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${yearly ? "translate-x-6" : "translate-x-1"}`} />
            </button>
            <span className={`text-sm font-medium ${yearly ? "text-slate-900" : "text-slate-500"}`}>
              Yearly <span className="text-emerald-600 font-semibold">Save ~17%</span>
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="text-center text-sm text-slate-400 py-12">Loading plans...</div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-sm text-red-600">{error}</p>
            <p className="text-xs text-slate-400 mt-2">Run the Supabase migration to seed plan data.</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center text-sm text-slate-400 py-12">No plans available</div>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {plans.map((plan) => (
                <Card key={plan.id} className={`relative ${colorMap[plan.id] || ""}`}>
                  {plan.id === "pro" && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="pro">Most Popular</Badge>
                    </div>
                  )}
                  <CardContent className="p-6 text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                      {iconMap[plan.id] || <Sparkles className="w-6 h-6" />}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                    <p className="text-sm text-slate-500 mt-1 mb-4">{plan.description}</p>
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-slate-900">
                        {plan.price_monthly_cents === 0 ? "Free" : formatPrice(yearly ? plan.price_yearly_cents / 12 : plan.price_monthly_cents)}
                      </span>
                      {plan.price_monthly_cents > 0 && (
                        <span className="text-sm text-slate-500 ml-1">/month</span>
                      )}
                      {yearly && plan.price_monthly_cents > 0 && (
                        <p className="text-xs text-slate-400 mt-1">{formatPrice(plan.price_yearly_cents)} billed annually</p>
                      )}
                    </div>
                    <Button
                      variant={plan.id === "free" ? "secondary" : "primary"}
                      className="w-full mb-6"
                      onClick={() => {
                        if (plan.id === "free") {
                          window.location.href = "/dashboard";
                        } else {
                          window.open("https://paddle.com/checkout?plan=" + plan.id, "_blank");
                        }
                      }}
                    >
                      {plan.id === "free" ? "Get Started" : `Choose ${plan.name}`}
                    </Button>
                    <ul className="space-y-3 text-left">
                      {(plan.features as string[]).map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-8 max-w-5xl mx-auto">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-slate-100 rounded-lg shrink-0">
                      <Building2 className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Payment Options for Pakistan</h3>
                      <p className="text-sm text-slate-500 mt-1 max-w-2xl">
                        Since Stripe isn&apos;t available in Pakistan, we use <strong>Paddle</strong> as our payment provider.
                        Paddle accepts credit/debit cards, PayPal, and works globally. You can also pay via bank transfer.
                      </p>
                      <div className="flex items-center gap-3 mt-3">
                        <a href="https://paddle.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700">
                          Learn about Paddle <ExternalLink className="w-3 h-3" />
                        </a>
                        <span className="text-slate-300">|</span>
                        <a href="/settings" className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700">
                          Configure bank transfer in Settings
                        </a>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
