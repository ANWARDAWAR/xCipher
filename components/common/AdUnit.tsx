"use client";

import React, { useEffect, useRef } from "react";
import Script from "next/script";
import { useCookiePreference } from "./CookieConsent";

declare global {
  interface Window {
    adsbygoogle?: { push: (ad: Record<string, never>) => unknown };
  }
}

/** Mounted once by the public layout; no ad requests before consent. */
export function AdSenseScript() {
  const preference = useCookiePreference();
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID?.trim();
  if (!clientId || preference !== "accepted") return null;

  return (
    <Script
      id="google-adsense"
      async
      strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
      crossOrigin="anonymous"
    />
  );
}

interface AdUnitProps {
  isActive?: boolean;
  slotId?: string;
  location: string;
  size?: string;
  slotClass?: string;
  style?: React.CSSProperties;
}

export default function AdUnit({
  isActive = true,
  slotId = process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID,
  location,
  size = "728 × 90",
  slotClass = "ad-leaderboard",
  style,
}: AdUnitProps) {
  const preference = useCookiePreference();
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID?.trim();
  const resolvedSlot = slotId?.trim();
  if (!isActive || !clientId || !resolvedSlot || preference !== "accepted") return null;

  // A changed placement gets a fresh element; never reinitialize an existing ad.
  return <ActiveAd key={`${location}:${clientId}:${resolvedSlot}`} clientId={clientId} slotId={resolvedSlot} location={location} size={size} slotClass={slotClass} style={style} />;
}

function ActiveAd({ clientId, slotId, location, size, slotClass, style }: AdUnitProps & { clientId: string; slotId: string }) {
  const element = useRef<HTMLModElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    const ad = element.current;
    if (!ad) return;

    const initialize = () => {
      if (initialized.current || ad.hasAttribute("data-adsbygoogle-status") || ad.getBoundingClientRect().width === 0) return;
      try {
        (window.adsbygoogle = window.adsbygoogle || ([] as Record<string, never>[])).push({});
        initialized.current = true;
      } catch {
        // Blocked/unavailable ads must not interrupt reading.
      }
    };

    initialize();
    // Hidden responsive containers may only gain width after layout settles.
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(initialize);
    observer?.observe(ad);
    return () => observer?.disconnect();
  }, []);

  return (
    <div
      className="grid grid-rows-[1fr] opacity-100 transition-[grid-template-rows,opacity] duration-500 ease-in-out"
    >
      <div className="overflow-hidden">
        <div className="ad-wrap" style={style}>
          <div className="ad-label">Advertisement</div>
          <div
            className={`ad-slot ${slotClass}`}
            style={{ display: "block", width: "100%" }}
            data-ad-location={location}
            data-ad-size={size}
            role="complementary"
            aria-label="Advertisement placement"
          >
            <ins
              ref={element}
              className="adsbygoogle"
              style={{ display: "block", width: "100%" }}
              data-ad-client={clientId}
              data-ad-slot={slotId}
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
