import type { Metadata, Viewport } from "next";
import { Instrument_Serif, JetBrains_Mono, Manrope } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { hasResume } from "@/components/ContactLinks";
import { Island } from "@/components/Island";
import { MenuBar } from "@/components/MenuBar";
import { Palette } from "@/components/Palette";
import { HapticsToggle, MotionToggle, SoundToggle, ViewToggle } from "@/components/ViewToggle";
import { Atmosphere, Entrance } from "@/components/World";
import { Desktop } from "@/components/Desktop";
import { System } from "@/components/System";
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

/** `modal` is the parallel route that opens case studies as windows over the page. */
export default function RootLayout({ children, modal }: { children: React.ReactNode; modal: React.ReactNode }) {
  return (
    // The entrance script sets data attributes on <html> before hydration.
    <html lang="en" data-view="plain" className={`${serif.variable} ${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <body>
        <Entrance />
        <Atmosphere />
        <a className="skip-link" href="#main">Skip to content</a>
        <MenuBar />
        <Island />
        <Palette hasResume={hasResume} />
        <main id="main">{children}</main>
        <Desktop hasResume={hasResume} />
        <System />
        {modal}
        <footer className="footer">
          <div className="wrap">
            <span>© {new Date().getFullYear()} {site.name}</span>
            <span>
              Built from scratch · <a href={site.links.github}>Source on GitHub</a> · <ViewToggle /> · <MotionToggle /> · <SoundToggle />
              <HapticsToggle />
            </span>
          </div>
        </footer>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
