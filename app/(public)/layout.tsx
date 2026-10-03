import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import ScrollReveal from "@/components/common/ScrollReveal";
import BackToTop from "@/components/common/BackToTop";
import ScrollReset from "@/components/common/ScrollReset";
import CookieConsent from "@/components/common/CookieConsent";
import { AdSenseScript } from "@/components/common/AdUnit";
import { generateOrganizationJsonLd } from "@/lib/entity-schema";
import { serializeJsonLd } from "@/lib/article-schema";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <link rel="preconnect" href="https://res.cloudinary.com" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(generateOrganizationJsonLd()) }}
      />
      {/*
        The .skip-link styles have existed in globals.css since the redesign --
        offscreen until focused, sliding in at :focus -- but no page ever
        rendered the element, so a keyboard user still had to tab through the
        entire header on every navigation. The <main> below was already given
        id="view" and tabIndex={-1} to receive focus; only the link was missing.
      */}
      <a href="#view" className="skip-link">
        Skip to content
      </a>
      <ScrollReset />
      <ScrollReveal />
      <SiteHeader />
      <main id="view" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
      <BackToTop />
      <CookieConsent />
      <AdSenseScript />
      <div id="toast" role="status" aria-live="polite"></div>
    </>
  );
}
