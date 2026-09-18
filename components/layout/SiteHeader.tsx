"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import MobileDrawer from "./MobileDrawer";
import { SearchProvider, SearchButton } from "../search/SearchOverlay";

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
      <header className="site-head">
        <div className="utility">
          <div className="wrap utility-in">
            <span id="todayDate" className="util-date">
              <span className="date-full">{todayDateFull || "—"}</span>
              <span className="date-compact">{todayDateCompact || "—"}</span>
            </span>
            <span className="util-tag">Independent Technology News</span>
            <span className="spacer"></span>
            <label className="sr-only" htmlFor="edition">Edition</label>
            <select id="edition" className="edition" aria-label="Select edition">
              <option>Global Edition</option>
              <option>Asia Pacific</option>
              <option>Europe</option>
              <option>Americas</option>
            </select>
            <ThemeToggle />
            <div className="util-social">
              <Link href="/page/about" aria-label="xSypher on X">
                <svg className="ic-s" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.9 2H22l-6.8 7.8L23.3 22h-6.3l-4.9-6.4L6.4 22H3.3l7.3-8.3L1 2h6.5l4.4 5.9L18.9 2zm-1.1 18h1.7L7.1 3.9H5.3L17.8 20z" />
                </svg>
              </Link>
              <Link href="/page/about" aria-label="xSypher on YouTube">
                <svg className="ic-s" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23 12s0-3.3-.4-4.9c-.2-.9-.9-1.6-1.8-1.8C19.2 5 12 5 12 5s-7.2 0-8.8.3c-.9.2-1.6.9-1.8 1.8C1 8.7 1 12 1 12s0 3.3.4 4.9c.2.9.9 1.6 1.8 1.8 1.6.3 8.8.3 8.8.3s7.2 0 8.8-.3c-.9-.2 1.6-.9 1.8-1.8.4-1.6.4-4.9.4-4.9zM9.8 15.5v-7l6 3.5-6 3.5z" />
                </svg>
              </Link>
              <Link href="/page/about" aria-label="xSypher on LinkedIn">
                <svg className="ic-s" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V24h-4V8zm7.5 0h3.8v2.2h.1c.5-1 1.8-2.2 3.8-2.2 4 0 4.8 2.7 4.8 6.1V24h-4v-8.5c0-2-.4-3.5-2.1-3.5-1.7 0-2.4 1.2-2.4 3.4V24h-4V8z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
        <div className="wrap masthead">
          <MobileDrawer />
          <Link className="logo" href="/" aria-label="xSypher — home">
            <svg width="27" height="27" viewBox="0 0 26 26" aria-hidden="true">
              <rect x="1" y="1" width="10" height="10" fill="currentColor" />
              <rect x="15" y="1" width="10" height="10" fill="currentColor" opacity=".32" />
              <rect x="1" y="15" width="10" height="10" fill="currentColor" opacity=".32" />
              <path d="M15.5 15.5 24.5 24.5M24.5 15.5l-9 9" stroke="var(--accent)" strokeWidth="3.2" strokeLinecap="round" />
            </svg>
            <span className="wm">x<span className="wm-x">Sypher</span></span>
            <span className="logo-sub">Tech · Reported<br />Daily since 2019</span>
          </Link>
          <nav className="primary-nav" id="primaryNav" aria-label="Primary"></nav>
          <div className="mast-actions">
            <SearchButton />
            <Link className="btn btn-solid" href="/page/newsletter" id="subscribeBtn">Subscribe</Link>
          </div>
        </div>
        <div className={`navrow ${isStuck ? "stuck" : ""}`} id="navrow">
          <div className="wrap navrow-in md:justify-center" id="navrowIn" role="navigation" aria-label="Sections">
            {NAV_ROW.map((item) => {
              const active = isLinkActive(item.href);
              const classes = [item.className, active ? "on" : ""].filter(Boolean).join(" ");
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
