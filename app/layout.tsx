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
      <body suppressHydrationWarning>
        <ThemeProvider attribute="data-theme" defaultTheme="system" storageKey="xcipher-theme" disableTransitionOnChange enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
