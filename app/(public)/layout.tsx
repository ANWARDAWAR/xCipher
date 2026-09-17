import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import ScrollReveal from "@/components/common/ScrollReveal";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <ScrollReveal />
      <SiteHeader />
      <main id="view" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
      <div id="toast" role="status" aria-live="polite"></div>
    </>
  );
}
