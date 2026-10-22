import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Acme Store Support — Phase 1 Starter",
  description: "Streaming support chatbot with typed tool calls (Next.js + AI SDK)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
