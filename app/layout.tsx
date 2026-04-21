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

const SITE_NAME = "Mike Ncube — AI Engineer";
const SITE_DESCRIPTION =
  "Mike S Ncube — AI Engineer. Agentic AI & applied LLM workflows, Python backends (Flask / FastAPI), and data pipelines.";

export const metadata: Metadata = {
  metadataBase: new URL("https://mike-portfolio-tawny.vercel.app"),
  title: {
    default: `${SITE_NAME} · Agentic AI & Applied LLM Workflows · Python Backends · Data Pipelines`,
    template: "%s · Mike Ncube",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "AI Engineer",
    "Agentic AI",
    "Applied LLM Workflows",
    "RAG",
    "LangChain",
    "LLM workflows",
    "LLM orchestration",
    "Python backend engineer",
    "FastAPI",
    "Flask",
    "AWS",
    "data pipelines",
    "workflow automation",
    "systems engineering",
    "Mike Ncube",
  ],
  authors: [{ name: "Mike S Ncube" }],
  creator: "Mike S Ncube",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    title: `${SITE_NAME} · Agentic AI & Applied LLM Workflows · Python Backends · Data Pipelines`,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    images: [{ url: "/Mike_Org.jpeg", width: 1024, height: 1024, alt: "Mike S Ncube" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ["/Mike_Org.jpeg"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0a0d14",
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
