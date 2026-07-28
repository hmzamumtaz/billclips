const colors: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  sent: "bg-amber-50 text-amber-700 ring-amber-600/20",
  overdue: "bg-red-50 text-red-700 ring-red-600/20",
  draft: "bg-slate-50 text-slate-600 ring-slate-500/20",
  cancelled: "bg-slate-50 text-slate-500 ring-slate-400/20",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  inactive: "bg-slate-50 text-slate-500 ring-slate-400/20",
  free: "bg-slate-50 text-slate-600 ring-slate-500/20",
  pro: "bg-indigo-50 text-indigo-700 ring-indigo-500/20",
  enterprise: "bg-purple-50 text-purple-700 ring-purple-500/20",
};

export function Badge({ variant = "sent", children }: { variant?: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${colors[variant] || colors.sent}`}>
      {children}
    </span>
  );
}
