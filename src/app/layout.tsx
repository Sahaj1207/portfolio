import type { Metadata, Viewport } from "next";
import { Instrument_Serif, JetBrains_Mono, Manrope } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { hasResume } from "@/components/ContactLinks";
import { Island } from "@/components/Island";
import { Palette } from "@/components/Palette";
import { MotionToggle, ViewToggle } from "@/components/ViewToggle";
import { site } from "@/content/site";
import "./globals.css";

// Cinematic display serif for the big words; a warm humanist sans for reading.
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif", display: "swap" });
const sans = Manrope({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.role}`, template: `%s — ${site.name}` },
  description: site.positioning,
  openGraph: { type: "website", siteName: site.name, url: site.url },
  twitter: { card: "summary_large_image", creator: "@sahaj0712" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = { themeColor: "#0c1626", colorScheme: "dark" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-view="plain" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        <Island />
        <Palette hasResume={hasResume} />
        <main id="main">{children}</main>
        <footer className="footer">
          <div className="wrap">
            <span>© {new Date().getFullYear()} {site.name}</span>
            <span>
              Built from scratch · <a href={site.links.github}>Source on GitHub</a> · <ViewToggle /> · <MotionToggle />
            </span>
          </div>
        </footer>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
