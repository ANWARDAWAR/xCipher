"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";

const STORAGE_KEY = "xsypher-cookie-consent";
const CHANGE_EVENT = "xsypher-cookie-consent-change";
type Preference = "accepted" | "declined";
let sessionPreference: Preference | null = null;

function readPreference(): Preference | null {
  if (sessionPreference !== null) return sessionPreference;
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "accepted" || value === "declined" ? value : null;
  } catch {
    return sessionPreference;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function serverPreference(): undefined {
  return undefined;
}

export function useCookiePreference() {
  return useSyncExternalStore(subscribe, readPreference, serverPreference);
}

export default function CookieConsent() {
  const savedPreference = useCookiePreference();

  const choose = (preference: Preference) => {
    try {
      localStorage.setItem(STORAGE_KEY, preference);
      sessionPreference = null;
    } catch {
      // Respect the choice for this visit when browser storage is unavailable.
      sessionPreference = preference;
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  };

  if (savedPreference !== null) return null;

  return (
    <aside aria-label="Cookie preferences" className="fixed bottom-4 left-4 right-4 md:w-96 z-[999] rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4 text-[var(--ink)] shadow-lg">
      <p className="text-sm font-semibold">Cookie preferences</p>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Choose whether to allow optional cookies. Essential cookies remain enabled.{" "}
        <Link href="/page/cookie-policy" className="underline underline-offset-2">Cookie policy</Link>
      </p>
      <div className="mt-4 flex gap-2">
        <button type="button" onClick={() => choose("accepted")} className="flex-1 rounded-lg border border-[var(--line)] px-4 py-2 text-sm font-semibold transition-colors hover:bg-[var(--surface)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">Accept</button>
        <button type="button" onClick={() => choose("declined")} className="flex-1 rounded-lg border border-[var(--line)] px-4 py-2 text-sm font-semibold transition-colors hover:bg-[var(--surface)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">Decline</button>
      </div>
    </aside>
  );
}
