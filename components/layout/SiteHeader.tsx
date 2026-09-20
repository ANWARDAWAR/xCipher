"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import MobileDrawer from "./MobileDrawer";
import { SearchProvider, SearchButton } from "../search/SearchOverlay";
import { SocialIcon } from "@/components/author/AuthorProfileView";

const NAV_ROW = [
  { name: "Home", href: "/", className: "nr-home" },
  { name: "Latest", href: "/latest" },
  { name: "AI", href: "/category/ai" },
  { name: "Cybersecurity", href: "/category/cybersecurity" },
  { name: "Gadgets", href: "/category/gadgets" },
  { name: "Software", href: "/category/software" },
  { name: "Programming", href: "/category/programming" },
  { name: "Startups", href: "/category/business" },
  { name: "Gaming", href: "/category/gaming" },
  { name: "Reviews", href: "/category/reviews" },
  { name: "How-To", href: "/category/howto" },
  { name: "Opinion", href: "/category/opinion" },
  { name: "Science", href: "/category/science" },
];

export default function SiteHeader() {
  const pathname = usePathname() || "";
  const [todayDateFull, setTodayDateFull] = useState("");
  const [todayDateCompact, setTodayDateCompact] = useState("");
  const [isStuck, setIsStuck] = useState(false);
  const navScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the active category link into view on mobile
  useEffect(() => {
    if (!navScrollRef.current) return;

    // Use a small timeout to ensure the DOM has updated with the 'on' class
    const timeoutId = setTimeout(() => {
      const activeLink = navScrollRef.current?.querySelector('.on');
      if (activeLink) {
        activeLink.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [pathname]);

  useEffect(() => {
    const now = new Date();
    setTodayDateFull(
      now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
    setTodayDateCompact(
      now.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    );

    const handleScroll = () => {
      const y = window.scrollY;
      setIsStuck(y > 140);
      document.body.classList.toggle("scrolled", y > 60);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.body.classList.remove("scrolled");
    };
  }, []);

  const isLinkActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <SearchProvider>
      <header className="site-head sticky top-0 z-[100] bg-[var(--surface)]">
        <div className="utility">
          <div className="wrap utility-in">
            <span id="todayDate" className="util-date">
              <span className="date-full">{todayDateFull || "—"}</span>
              <span className="date-compact">{todayDateCompact || "—"}</span>
            </span>
            <span className="w-1 h-1 rounded-full bg-[var(--accent)] shrink-0 mx-2" aria-hidden="true"></span>
            {/* Mobile Centered Social Icons */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 md:hidden [&_svg]:w-[14px] [&_svg]:h-[14px]">
              <Link href="#" aria-label="Facebook" className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors"><SocialIcon platform="facebook" /></Link>
              <Link href="#" aria-label="Instagram" className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors"><SocialIcon platform="instagram" /></Link>
              <Link href="#" aria-label="Twitter" className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors"><SocialIcon platform="twitter" /></Link>
              <Link href="#" aria-label="LinkedIn" className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors"><SocialIcon platform="linkedin" /></Link>
            </div>

            <span className="spacer flex-1"></span>

            {/* Desktop Right-aligned Social Icons */}
            <div className="hidden md:flex items-center gap-4 mr-4 [&_svg]:w-[14px] [&_svg]:h-[14px]">
              <Link href="#" aria-label="Facebook" className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors"><SocialIcon platform="facebook" /></Link>
              <Link href="#" aria-label="Instagram" className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors"><SocialIcon platform="instagram" /></Link>
              <Link href="#" aria-label="Twitter" className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors"><SocialIcon platform="twitter" /></Link>
              <Link href="#" aria-label="LinkedIn" className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors"><SocialIcon platform="linkedin" /></Link>
            </div>

            <ThemeToggle />
          </div>
        </div>
        <div className="wrap masthead !py-2 md:!py-4">
          <MobileDrawer />
          <Link className="logo" href="/" aria-label="xSypher — home">
            <svg viewBox="0 0 26 26" aria-hidden="true" className="w-5 h-5 md:w-[27px] md:h-[27px]">
              <rect x="1" y="1" width="10" height="10" fill="currentColor" />
              <rect x="15" y="1" width="10" height="10" fill="currentColor" opacity=".32" />
              <rect x="1" y="15" width="10" height="10" fill="currentColor" opacity=".32" />
              <path d="M15.5 15.5 24.5 24.5M24.5 15.5l-9 9" stroke="var(--accent)" strokeWidth="3.2" strokeLinecap="round" />
            </svg>
            <span className="wm flex items-baseline"><span>x</span><span className="wm-x font-kremlin font-normal tracking-wide">Sypher</span></span>
            <div className="hidden md:flex flex-col text-[6px] sm:text-[8px] md:text-[10px] font-bold tracking-[0.15em] text-[var(--muted)] uppercase leading-tight ml-2 border-l border-[var(--line)] pl-2">
              <span>ADVANCED TECH &</span>
              <span>SECURITY INSIGHTS</span>
            </div>
          </Link>
          <nav className="primary-nav" id="primaryNav" aria-label="Primary"></nav>
          <div className="mast-actions shrink-0">
            <SearchButton />
            <Link className="btn btn-solid shrink-0" href="/page/newsletters" id="subscribeBtn">Subscribe</Link>
          </div>
        </div>
        <div className={`navrow ${isStuck ? "stuck" : ""}`} id="navrow">
          <div className="wrap navrow-in md:justify-center" id="navrowIn" role="navigation" aria-label="Sections" ref={navScrollRef}>
            {NAV_ROW.map((item) => {
              const active = isLinkActive(item.href);
              const classes = [item.className, active ? "on text-white !text-white" : ""].filter(Boolean).join(" ");
              return (
                <Link
                  key={`${item.name}-${item.href}`}
                  href={item.href}
                  className={classes || undefined}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </header>
    </SearchProvider>
  );
}
