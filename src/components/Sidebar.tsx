"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Repeat,
  Settings,
  Receipt,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/sequences", label: "Sequences", icon: Repeat },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[var(--sidebar-bg)] flex flex-col z-50">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <Receipt className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white">BillClips</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-emerald-600 text-white"
                  : "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)]"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-7 h-7 bg-slate-600 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-white">BC</span>
          </div>
          <div className="text-sm text-[var(--sidebar-text)]">
            <p className="font-medium text-white">BillClips</p>
            <p className="text-xs">Free Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
