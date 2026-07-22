import type { Metadata } from "next";
import { SessionProvider } from "@/components/providers/session-provider";
import { BRANDING } from "@/lib/branding";
import "./globals.css";

export const metadata: Metadata = {
  title: BRANDING.systemName,
  description: `A digital WorkLog and attendance management system for ${BRANDING.organizationName}.`,
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
