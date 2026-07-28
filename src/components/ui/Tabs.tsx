"use client";

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="border-b border-slate-200">
      <nav className="flex gap-0 -mb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative px-4 py-3 text-sm font-medium transition-colors ${
              active === tab.id
                ? "text-emerald-600"
                : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${
                active === tab.id ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-[var(--fg-muted)]"
              }`}>
                {tab.count}
              </span>
            )}
            {active === tab.id && (
              <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-emerald-600 rounded-full" />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
