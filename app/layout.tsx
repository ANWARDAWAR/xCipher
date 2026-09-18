import type { Metadata } from "next";
import { getPublicationSettings } from "@/lib/settings";
import { Space_Grotesk, Geist, JetBrains_Mono } from 'next/font/google';
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";

// ─────────────────────────────────────────────────────────────────────────────
// Type system — three families, one job each.
//
// Replaces the previous Fraunces/Newsreader serif pairing. A serif masthead
// reads as legacy-press; this publication is a technology title, and the
// geometric grotesk + neutral sans + true mono combination is the register its
// readers already associate with technical writing.
//
// All three are variable fonts, so each ships one file covering its whole
// weight range rather than a request per weight.
// ─────────────────────────────────────────────────────────────────────────────

// Headlines. Geometric and sharp, with enough weight to carry a front page.
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
  // 300 is unused today but is the only weight below 400 this family offers;
  // including it keeps a lighter deck available without a second request.
  weight: ['300', '400', '500', '600', '700'],
});

// Reading text and interface. Tall x-height keeps body copy legible at the
// sizes this design uses, and holds up in dark mode where thin strokes tend to
// bloom against the background.
const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
});

// Code, and the metadata that should read as machine-precise: timestamps,
// kickers, tags, byline roles. Designed for long code lines, with a tall
// x-height and disambiguated 0/O and 1/l/I.
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

// Resolved per request from the settings row, falling back to the values that
// used to be hardcoded here. generateMetadata rather than a static object
// because the publication name is now editable without a deploy.
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicationSettings();
  return {
    title: settings.tagline
      ? `${settings.siteName} — ${settings.tagline}`
      : settings.siteName,
    description: settings.description,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${spaceGrotesk.variable} ${geist.variable} ${jetbrainsMono.variable}`}>
      <head>
        {/* Carry a theme chosen under a previous brand over to the current
            storage key. next-themes reads a single key, so without this a
            rename silently resets every reader to "system". Runs before
            hydration so the copied value is in place when the provider
            first reads it, avoiding a flash of the wrong theme. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k="xsypher-theme";if(localStorage.getItem(k))return;var old=["xcipher-theme","gridx-theme"];for(var i=0;i<old.length;i++){var v=localStorage.getItem(old[i]);if(v){localStorage.setItem(k,v);return;}}}catch(e){}})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider attribute="data-theme" defaultTheme="system" storageKey="xsypher-theme" disableTransitionOnChange enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
