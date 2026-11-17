import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Sans, Instrument_Serif, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { SITE_NAME, TAGLINE, staticOrigin } from "@/lib/site";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin", "latin-ext"],
  axes: ["wdth", "opsz"],
  display: "swap",
});
const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  display: "swap",
});
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin", "latin-ext"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(staticOrigin()),
  title: { default: `${SITE_NAME} — When Culture Travels`, template: `%s · ${SITE_NAME}` },
  description:
    "A living atlas and attribution layer for cultural heritage. Every tradition gets a passport: its names, places, makers, history, travels and sources. When culture travels, let its story travel with it.",
  applicationName: SITE_NAME,
  openGraph: { siteName: SITE_NAME, type: "website", title: SITE_NAME, description: TAGLINE },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#F6F0E3",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${instrumentSans.variable} ${instrumentSerif.variable} ${plexMono.variable}`}
    >
      <body className="min-h-dvh flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-ink focus:px-4 focus:py-2 focus:text-ivory"
        >
          Skip to content
        </a>
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
