import type { Metadata } from "next";
import { getPublicationSettings } from "@/lib/settings";
import { Space_Grotesk, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";

// ─────────────────────────────────────────────────────────────────────────────
// Type system — three roles, one family each.
//
//   headings    Cabinet Grotesk, falling back to Space Grotesk
//   body + UI   Plus Jakarta Sans
//   code + meta JetBrains Mono
//
// Cabinet Grotesk is a Fontshare release, not a Google font, so it cannot come
// through next/font/google — it has to be self-hosted. Its @font-face lives in
// globals.css and points at /public/fonts; see the note there for the files to
// drop in. Until they exist the headline stack falls through to Space Grotesk,
// which is the closest geometric grotesk available here and is loaded below for
// exactly that reason.
//
// Deliberately not next/font/local: that resolves paths at build time and fails
// the build outright when a file is missing, which would mean nobody can build
// this repo until the licensed files are committed. A plain @font-face just
// falls through instead.
//
// The Google families are variable, so each ships one file covering its whole
// weight range rather than a request per weight.
// ─────────────────────────────────────────────────────────────────────────────

// Headline fallback until Cabinet Grotesk is self-hosted, and the permanent
// second step of the display stack after that.
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

// Reading text and interface. Tall x-height and open apertures keep body copy
// legible at the sizes this design uses, and hold up in dark mode where thin
// strokes tend to bloom against the background.
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

// Code, and the metadata that should read as machine-precise: timestamps,
// kickers, tags. Designed for long code lines, with a tall x-height and
// disambiguated 0/O and 1/l/I.
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
    <html lang="en" suppressHydrationWarning className={`${spaceGrotesk.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}>
      <body suppressHydrationWarning>
        {/* Carry a theme chosen under a previous brand over to the current
            storage key. next-themes reads a single key, so without this a
            rename silently resets every reader to "system".
            
            First element in <body> rather than inside an explicit <head>: Next
            owns the head, and a raw <script> there logs "Encountered a script
            tag while rendering React component" on every render. Here it is
            still parsed and executed before the provider below mounts, which is
            all the ordering this needs -- it only has to beat next-themes to
            the storage key, not the first paint. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k="xsypher-theme";if(localStorage.getItem(k))return;var old=["xcipher-theme","gridx-theme"];for(var i=0;i<old.length;i++){var v=localStorage.getItem(old[i]);if(v){localStorage.setItem(k,v);return;}}}catch(e){}})();`,
          }}
        />
        <ThemeProvider attribute="data-theme" defaultTheme="system" storageKey="xsypher-theme" disableTransitionOnChange enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
