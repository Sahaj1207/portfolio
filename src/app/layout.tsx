import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Newsreader } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Island } from "@/components/Island";
import { site } from "@/content/site";
import "./globals.css";

const serif = Newsreader({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-serif", display: "swap" });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
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
        <main id="main">{children}</main>
        <footer className="footer">
          <div className="wrap">
            <span>© {new Date().getFullYear()} {site.name}</span>
            <span>
              Built from scratch · <a href={site.links.github}>Source on GitHub</a>
            </span>
          </div>
        </footer>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
