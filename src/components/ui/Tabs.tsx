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
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              active === tab.id
                ? "border-emerald-600 text-emerald-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${
                active === tab.id ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
