import type { Metadata, Viewport } from "next";
import { Fraunces, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

// Display: Fraunces — a high-contrast variable serif with optical size axis.
// Distinctively editorial; avoids the generic-grotesk template look.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  axes: ["opsz", "SOFT", "WONK"],
  style: ["normal", "italic"],
});

// Body: DM Sans — geometric, comfortable at 17–18px, pairs well with Fraunces.
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Mono: JetBrains Mono — for real code paths only.
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const SITE_URL = "https://mike-portfolio-tawny.vercel.app";
const SITE_NAME = "Mike S Ncube";
const SITE_DESCRIPTION =
  "Applied AI Engineer and Systems Architect building governed, auditable AI systems for regulated work. Six-plus years in software, three focused on generative AI. Live RAG assistant on this page.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Applied AI Engineer`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "Applied AI Engineer",
    "RAG",
    "Generative AI Engineer",
    "Python backend",
    "FastAPI",
    "LangGraph",
    "Mike Ncube",
    "South Africa",
  ],
  authors: [{ name: "Mike S Ncube" }],
  creator: "Mike S Ncube",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: `${SITE_NAME} — Applied AI Engineer`,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    // Mike to replace with a 1200×630 export of the portrait or a custom graphic.
    // Current image is square — social previews will crop it.
    images: [{ url: "/Mike_Org.jpeg", width: 1200, height: 630, alt: "Mike S Ncube, Applied AI Engineer" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Applied AI Engineer`,
    description: SITE_DESCRIPTION,
    images: ["/Mike_Org.jpeg"],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: SITE_URL },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F9F7F2" },
    { media: "(prefers-color-scheme: dark)", color: "#141210" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",  // enables safe-area-inset for iPhone
};

// Inline theme script — runs before any React hydration to prevent flash of
// wrong theme. Reads localStorage preference, falls back to system preference.
const themeScript = `
(function(){try{
  var s=localStorage.getItem('theme');
  var p=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
  document.documentElement.classList.toggle('dark',(s||p)==='dark');
}catch(e){}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${dmSans.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Theme toggle script must run before page paint to prevent FOUC */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-page"
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
