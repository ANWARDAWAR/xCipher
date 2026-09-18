"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ──────────────────────────────────────────────────────────────────────────────
// Draft cache — crash resilience for the article editor
// ──────────────────────────────────────────────────────────────────────────────
//
// The editor autosaves to the server every 5 seconds, which leaves a window
// where a browser crash, an accidental tab close, or a dropped connection
// loses whatever was typed since the last successful save. On a new story
// that could be the entire piece, because nothing exists server-side yet.
//
// This caches the form to localStorage on every keystroke (throttled), and
// surfaces it on next load so the writer can decide what to do with it.
//
// It deliberately does NOT auto-apply the cache. The server copy may be newer
// -- the same article can be edited from another device, or a co-author may
// have saved in between -- and silently replacing newer server content with
// older local content is a worse failure than the one being fixed. The editor
// prompts instead.
// ──────────────────────────────────────────────────────────────────────────────

const PREFIX = "xcipher:draft:";
const VERSION = 1;

/** Caches older than this are ignored: stale enough that restoring is likelier
 *  to confuse than to help. */
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export interface CachedDraft {
  version: number;
  /** Server article id, or null when the story has never been saved. */
  articleId: string | null;
  savedAt: string;
  values: Record<string, unknown>;
  bodyHtml: string;
}

/**
 * Cache key. New stories share one key (`new`) because they have no id yet;
 * saved stories key off the article id so two open drafts cannot collide.
 */
export function draftCacheKey(articleId: string | null | undefined): string {
  return `${PREFIX}${articleId || "new"}`;
}

function readCache(key: string): CachedDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CachedDraft;

    // A cache written by an older build may not match the current form shape.
    if (parsed?.version !== VERSION) {
      window.localStorage.removeItem(key);
      return null;
    }

    if (Date.now() - new Date(parsed.savedAt).getTime() > MAX_AGE_MS) {
      window.localStorage.removeItem(key);
      return null;
    }

    return parsed;
  } catch {
    // Corrupt JSON, or localStorage unavailable (Safari private mode throws on
    // access). Losing the cache is acceptable; breaking the editor is not.
    return null;
  }
}

export function clearDraftCache(articleId: string | null | undefined) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(draftCacheKey(articleId));
  } catch {
    /* non-fatal */
  }
}

interface UseDraftCacheOptions {
  articleId: string | null;
  /** Skip the restore prompt, e.g. before the editor has mounted content. */
  enabled?: boolean;
}

export function useDraftCache({ articleId, enabled = true }: UseDraftCacheOptions) {
  // Read once on mount, before any writes can overwrite what we are trying to
  // detect. Lazy initialiser so this runs during the first render, not after.
  const [recovered, setRecovered] = useState<CachedDraft | null>(() => {
    if (!enabled || typeof window === "undefined") return null;
    return readCache(draftCacheKey(articleId));
  });

  const lastWriteRef = useRef(0);
  const pendingRef = useRef<number | null>(null);

  const write = useCallback(
    (values: Record<string, unknown>, bodyHtml: string) => {
      if (typeof window === "undefined") return;

      const payload: CachedDraft = {
        version: VERSION,
        articleId,
        savedAt: new Date().toISOString(),
        values,
        bodyHtml,
      };

      try {
        window.localStorage.setItem(draftCacheKey(articleId), JSON.stringify(payload));
      } catch {
        // Quota exceeded or storage disabled. The server autosave is still the
        // primary path, so this stays silent rather than nagging the writer.
      }
    },
    [articleId]
  );

  /**
   * Throttled cache write. Called on every keystroke, so it writes at most
   * once a second -- serialising a long article on each character would be
   * enough main-thread work to be felt while typing.
   */
  const cache = useCallback(
    (values: Record<string, unknown>, bodyHtml: string) => {
      const now = Date.now();
      const elapsed = now - lastWriteRef.current;

      if (elapsed >= 1000) {
        lastWriteRef.current = now;
        write(values, bodyHtml);
        return;
      }

      // Trailing write, so the final keystroke before a crash is not the one
      // that gets dropped.
      if (pendingRef.current !== null) window.clearTimeout(pendingRef.current);
      pendingRef.current = window.setTimeout(() => {
        lastWriteRef.current = Date.now();
        pendingRef.current = null;
        write(values, bodyHtml);
      }, 1000 - elapsed);
    },
    [write]
  );

  useEffect(() => {
    return () => {
      if (pendingRef.current !== null) window.clearTimeout(pendingRef.current);
    };
  }, []);

  const dismissRecovery = useCallback(() => setRecovered(null), []);

  const discard = useCallback(() => {
    clearDraftCache(articleId);
    setRecovered(null);
  }, [articleId]);

  return { recovered, dismissRecovery, discard, cache, clearCache: discard };
}
