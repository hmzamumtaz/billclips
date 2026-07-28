"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Repeat,
  Settings,
  Receipt,
  User,
  CreditCard,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";

const mainNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/sequences", label: "Sequences", icon: Repeat },
];

const bottomNav = [
  { href: "/profile", label: "Profile", icon: User },
  { href: "/plans", label: "Plans", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[var(--sidebar-bg)] flex flex-col z-50">
      <div className="p-5 border-b border-slate-800/50">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/20 transition-transform group-hover:scale-105">
            <Receipt className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-white tracking-tight">BillClips</span>
            <p className="text-[11px] text-emerald-400/70 font-medium -mt-0.5">AR Management</p>
          </div>
        </Link>
      </div>

      <div className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
        <p className="px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Main</p>
        {mainNav.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                active
                  ? "bg-emerald-600/10 text-emerald-400 border border-emerald-600/20"
                  : "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-slate-200"
              }`}
            >
              <item.icon className={`w-4.5 h-4.5 ${active ? "text-emerald-400" : ""}`} />
              {item.label}
            </Link>
          );
        })}

        <p className="px-3 pt-5 pb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Account</p>
        {bottomNav.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                active
                  ? "bg-emerald-600/10 text-emerald-400 border border-emerald-600/20"
                  : "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-slate-200"
              }`}
            >
              <item.icon className={`w-4.5 h-4.5 ${active ? "text-emerald-400" : ""}`} />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="p-3 border-t border-slate-800/50">
        <Link href="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--sidebar-hover)] transition-colors group">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-full flex items-center justify-center shadow-sm">
            <span className="text-xs font-bold text-white">BC</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">Free Plan</p>
            <p className="text-[11px] text-emerald-400/70">Upgrade</p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
