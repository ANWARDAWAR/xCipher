"use client";

import { useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Relative timestamp
// ─────────────────────────────────────────────────────────────────────────────
//
// Server components were computing "12 minutes ago" with Date.now() at render
// time. Those pages are cached with ISR (300s on the homepage, 180s on
// /latest), so the string was frozen into the cached HTML: a story rendered at
// the top of the window still claimed "2 minutes ago" five minutes later, and
// every reader in that window saw the same wrong number.
//
// react-hooks/purity flagged the Date.now() calls, and the rule is right for a
// reason beyond render purity -- a value read from the clock does not belong in
// output that is cached and replayed.
//
// The server now emits the absolute publication time; this computes the
// relative phrasing in the browser, where "now" is actually now. The <time>
// element carries the machine-readable timestamp either way, so the markup is
// correct for crawlers and assistive tech even before hydration.
// ─────────────────────────────────────────────────────────────────────────────

/** Same phrasing the server-side helper used, so nothing about the copy
 *  changes -- only when it is calculated. */
export function formatAge(mins: number): string {
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} minutes ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return h === 1 ? "1 hour ago" : `${h} hours ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "1 day ago" : `${d} days ago`;
}

function minutesSince(iso: string): number {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 0;
  return Math.max(0, Math.floor((Date.now() - then) / 60000));
}

interface Props {
  /** ISO-8601 publication time. */
  dateTime: string;
  className?: string;
}

export default function RelativeTime({ dateTime, className }: Props) {
  // Rendered on the server and on the first client pass as the absolute date,
  // so the two agree and there is no hydration mismatch. The relative phrasing
  // replaces it after mount.
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setLabel(formatAge(minutesSince(dateTime)));
    update();

    // A minute is the smallest unit this displays, so there is nothing to gain
    // from ticking faster. One interval per timestamp, cleared on unmount.
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [dateTime]);

  const absolute = new Date(dateTime);
  const valid = !Number.isNaN(absolute.getTime());

  return (
    <time dateTime={valid ? absolute.toISOString() : undefined} className={className}>
      {label ??
        (valid
          ? absolute.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
          : "")}
    </time>
  );
}
