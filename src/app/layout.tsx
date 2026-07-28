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
  description: "Automated accounts receivable and late invoice management platform",
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
        <div className="flex-1 ml-64 min-h-screen flex flex-col">
          {children}
        </div>
        <Toaster
          position="top-right"
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
      </body>
    </html>
  );
}
