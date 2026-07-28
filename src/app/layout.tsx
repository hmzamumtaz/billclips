import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
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
  description: "Automated accounts receivable and late invoice management platform",
};

export const dynamic = 'force-dynamic';

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
        <AuthProvider>
          <AppShell>
            {children}
          </AppShell>
          <Toaster
            position="top-right"
            containerStyle={{ top: 72 }}
            toastOptions={{
              duration: 3000,
              style: {
                background: "var(--card-bg)",
                color: "var(--foreground)",
                border: "1px solid var(--card-border)",
                fontSize: "14px",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
