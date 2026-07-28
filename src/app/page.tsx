import Link from "next/link";
import { ArrowRight, CheckCircle, Bell, Receipt, Repeat, BarChart3, Shield } from "lucide-react";

const features = [
  {
    icon: Repeat,
    title: "Auto-reminder sequences",
    desc: "Set escalation rules — gentle at 3 days, urgent at 7, final notice at 14. BillClips handles the chasing.",
  },
  {
    icon: Receipt,
    title: "Invoice management",
    desc: "Create, send, and track invoices from one dashboard. Know exactly who has paid and who hasn't.",
  },
  {
    icon: BarChart3,
    title: "Real-time dashboard",
    desc: "See outstanding AR, upcoming due dates, and overdue invoices at a glance — no spreadsheet needed.",
  },
];

const steps = [
  { num: "01", label: "Create invoice", desc: "Fill client details, amount, and due date. Done in under 30 seconds." },
  { num: "02", label: "Pick a sequence", desc: "Choose an escalation workflow or build your own reminder cadence." },
  { num: "03", label: "Let it run", desc: "BillClips sends reminders automatically. You get paid without lifting a finger." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="border-b border-[var(--card-border)] bg-white/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-[var(--fg)]">BillClips</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/login" className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">Sign in</Link>
            <Link href="/signup" className="inline-flex items-center gap-1.5 text-sm font-medium bg-emerald-600 text-white px-4 py-1.5 rounded-[var(--radius-sm)] hover:bg-emerald-700 transition-colors shadow-sm">
              Get started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </nav>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-medium text-emerald-700 mb-6">
          <Shield className="w-3 h-3" /> Built for freelancers & small businesses
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-[var(--fg)] leading-[1.1] max-w-3xl mx-auto">
          Never chase a payment again.
        </h1>
        <p className="mt-4 text-lg text-[var(--fg-muted)] max-w-xl mx-auto leading-relaxed">
          BillClips sends automated invoice reminders on your behalf — so you focus on work, not on chasing clients.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link href="/signup" className="inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-[var(--radius-sm)] font-medium text-sm hover:bg-emerald-700 transition-colors shadow-sm hover:shadow">
            Start free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/login" className="inline-flex items-center gap-2 bg-white text-[var(--fg)] border border-[var(--card-border)] px-5 py-2.5 rounded-[var(--radius-sm)] font-medium text-sm hover:bg-slate-50 transition-colors shadow-sm">
            Sign in
          </Link>
        </div>
        <p className="mt-4 text-xs text-[var(--fg-muted)]">Free plan included. No credit card required.</p>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-white border border-[var(--card-border)] rounded-[var(--radius)] p-6 hover:shadow-[var(--card-shadow-hover)] transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--fg)]">{f.title}</h3>
              <p className="mt-1.5 text-sm text-[var(--fg-muted)] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border-y border-[var(--card-border)]">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-[var(--fg)]">How it works</h2>
            <p className="mt-2 text-sm text-[var(--fg-muted)]">Three steps to automated accounts receivable.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((s) => (
              <div key={s.num} className="text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-sm font-bold text-emerald-700">{s.num}</span>
                </div>
                <h3 className="text-sm font-semibold text-[var(--fg)]">{s.label}</h3>
                <p className="mt-1.5 text-sm text-[var(--fg-muted)] leading-relaxed max-w-[240px] mx-auto">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="bg-emerald-600 rounded-[var(--radius)] p-10 sm:p-14 text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-bold">Start getting paid faster</h2>
          <p className="mt-3 text-emerald-100 text-sm max-w-lg mx-auto leading-relaxed">
            Join freelancers and businesses who've cut their average receivables time in half.
          </p>
          <div className="mt-6 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-300" /> Free plan</div>
            <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-300" /> No credit card</div>
            <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-300" /> Cancel anytime</div>
          </div>
          <Link href="/signup" className="inline-flex items-center gap-2 bg-white text-emerald-700 px-6 py-2.5 rounded-[var(--radius-sm)] font-medium text-sm hover:bg-emerald-50 transition-colors shadow-sm mt-8">
            Try BillClips free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-[var(--card-border)] bg-white">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between text-xs text-[var(--fg-muted)]">
          <span>&copy; {new Date().getFullYear()} BillClips</span>
          <div className="flex items-center gap-4">
            <span>Payments via Paddle</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span>Built in Pakistan</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
