import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BillClips — Automated AR & Invoice Chasing",
  description: "Automated accounts receivable and late invoice management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex">
        <Sidebar />
        <main className="flex-1 ml-64 min-h-screen">
          <div className="border-b border-[var(--card-border)] bg-white px-8 py-4">
            <nav className="text-sm text-slate-500">
              <span className="text-slate-900 font-medium">BillClips</span>
              <span className="mx-2">/</span>
              <span id="breadcrumb">Dashboard</span>
            </nav>
          </div>
          <div className="p-8">{children}</div>
        </main>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "var(--card-bg)",
              color: "var(--foreground)",
              border: "1px solid var(--card-border)",
            },
          }}
        />
      </body>
    </html>
  );
}
