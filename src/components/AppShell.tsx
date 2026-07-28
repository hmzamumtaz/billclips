"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";

const publicPages = ["/login", "/signup"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = publicPages.includes(pathname);

  return (
    <>
      <Sidebar />
      <div className={`flex-1 min-h-screen flex flex-col ${isPublic ? "ml-0" : "ml-64"}`}>
        {children}
      </div>
    </>
  );
}
