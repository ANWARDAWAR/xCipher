import type { Metadata } from "next";
import { getPublicationSettings } from "@/lib/settings";
import { Fraunces, Space_Grotesk, Newsreader } from 'next/font/google';
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
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
    <html lang="en" suppressHydrationWarning className={`${fraunces.variable} ${spaceGrotesk.variable} ${newsreader.variable}`}>
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
