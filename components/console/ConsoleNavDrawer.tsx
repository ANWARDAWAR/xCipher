"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Mobile drawer wrapper for the console sidebar.
 *
 * Below 900px the sidebar was laid out as a horizontal scroller: ten nav items
 * in a single row, most of them off-screen, with nothing indicating more
 * existed. The profile card and the group labels are both display:none at that
 * width too, so the mobile nav lost its structure as well as its visibility.
 *
 * This wraps the *existing* server-rendered nav rather than duplicating it.
 * The links, their capability gating and the review badge are all computed on
 * the server exactly as before and passed in as children -- so there is one
 * navigation definition, not two that can drift.
 *
 * Desktop is untouched: at >=900px the drawer chrome is hidden by CSS and the
 * sidebar renders in the grid column it always did.
 *
 * There is a deliberate non-use of MobileDrawer here. That component exists for
 * the public site and carries its own theme toggle and marketing links; sharing
 * it would mean bending one component around two unrelated menus.
 */
export default function ConsoleNavDrawer({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Escape closes, and focus returns to the button that opened it -- otherwise
  // focus is left on a hidden element and keyboard users lose their place.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  // Any link click inside the panel is a navigation, so the drawer closes.
  const handlePanelClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("a")) setIsOpen(false);
  };

  // Move focus into the panel when it opens so the next Tab lands on a nav
  // link rather than continuing through the page behind the scrim.
  useEffect(() => {
    if (isOpen) panelRef.current?.focus();
  }, [isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="cs-drawer-trigger"
        onClick={() => setIsOpen(true)}
        aria-label="Open console navigation"
        aria-expanded={isOpen}
        aria-controls="console-nav"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>

      {/* Scrim. Fixed dark in both themes on purpose: a scrim that flips with
          the theme washes out in dark mode. */}
      <div
        className={`cs-drawer-scrim${isOpen ? " open" : ""}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        id="console-nav"
        className={`cs-drawer-panel${isOpen ? " open" : ""}`}
        tabIndex={-1}
      >
        <div className="cs-drawer-head">
          <span className="cs-drawer-title">Navigation</span>
          <button
            type="button"
            className="cs-drawer-close"
            onClick={() => {
              setIsOpen(false);
              triggerRef.current?.focus();
            }}
            aria-label="Close navigation"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/*
          Close on navigation by listening for a click on any link inside the
          panel, rather than by watching pathname in an effect. Reacting to the
          route change would mean calling setState from an effect -- which
          eslint's react-hooks/set-state-in-effect rejects, and rightly: it
          schedules a second render pass for something already known at the
          moment of the click. Capturing the click also closes the drawer for
          a link to the current route, which a pathname watcher would miss.
        */}
        <div onClick={handlePanelClick}>{children}</div>
      </div>
    </>
  );
}
