import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Peak 38 — Ironman Journey",
  description: "26-month transformation tracker toward a self-organized Ironman on my 38th birthday",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[var(--color-bg-primary)] antialiased text-[var(--color-text-primary)]">
        {children}
      </body>
    </html>
  );
}
