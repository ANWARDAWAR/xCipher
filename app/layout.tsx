import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "xCipher — Independent Technology News, Analysis and Reviews",
  description: "xCipher is an independent technology publication covering AI, cybersecurity, gadgets, software, programming, startups, gaming and the tech business — with original reporting, reviews and analysis.",
};

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
