import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  title: {
    default: "PRDKit — Generator PRD untuk AI Coding",
    template: "%s · PRDKit",
  },
  description:
    "Bikin PRD siap pakai untuk AI coding, gratis. Dari ide jadi dokumen terstruktur 10-section yang langsung bisa diimplementasikan Cursor, Claude, atau v0.",
  keywords: [
    "PRD",
    "AI Coding",
    "Cursor",
    "Claude Code",
    "v0",
    "Generator PRD",
    "Product Requirements Document",
    "Indonesia",
  ],
  authors: [{ name: "PRDKit" }],
  creator: "PRDKit",
  publisher: "PRDKit",
  applicationName: "PRDKit",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "PRDKit — Bikin PRD yang AI paham dalam satu prompt",
    description:
      "Generator PRD gratis untuk AI coding. Dari ide jadi dokumen 10-section terstruktur dalam <90 detik. Powered by Claude.",
    type: "website",
    locale: "id_ID",
    siteName: "PRDKit",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "PRDKit — Generator PRD untuk AI Coding",
    description:
      "Bikin PRD siap pakai untuk AI coding, gratis. Dari ide jadi dokumen terstruktur 10-section dalam <90 detik.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${playfairDisplay.variable} antialiased bg-background text-foreground`}
      >
        {/* Skip to content — accessibility (WCAG 2.4.1 Bypass Blocks) */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-foreground focus:px-4 focus:py-2 focus:text-background focus:shadow-lg"
        >
          Lewati ke konten utama
        </a>
        <Providers>
          <div id="main-content">{children}</div>
        </Providers>
        <Toaster />
        <Sonner />
      </body>
    </html>
  );
}
