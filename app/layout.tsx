import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const SITE_NAME = "Mike — AI Engineer";
const SITE_DESCRIPTION =
  "AI Engineer building agentic AI systems, LLM workflow automation, and production Python backends (Flask / FastAPI). Systems-first engineering for AI platforms, fintech, and enterprise.";

export const metadata: Metadata = {
  metadataBase: new URL("https://mike.dev"),
  title: {
    default: `${SITE_NAME} · Agentic AI · LLM Workflows · Python Backend`,
    template: "%s · Mike",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "AI Engineer",
    "Agentic AI",
    "LLM workflows",
    "LLM orchestration",
    "Python backend engineer",
    "FastAPI",
    "Flask",
    "data pipelines",
    "workflow automation",
    "systems engineering",
    "RAG",
    "vector databases",
  ],
  authors: [{ name: "Mike" }],
  creator: "Mike",
  openGraph: {
    type: "website",
    title: `${SITE_NAME} · Agentic AI · LLM Workflows · Python Backend`,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#07080a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:text-ink-900"
        >
          Skip to content
        </a>
        <Nav />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
