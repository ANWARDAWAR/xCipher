"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { X, ImagePlus, MonitorPlay, AlertCircle } from "lucide-react";
import { ALLOWED_MEDIA_DOMAINS } from "@/lib/sanitize";
import { parseYouTubeId, youTubeThumbnail } from "@/lib/embeds";

// ─────────────────────────────────────────────────────────────────────────────
// Insert image / video
// ─────────────────────────────────────────────────────────────────────────────
//
// Replaces four chained window.prompt() calls. Those could not be cancelled
// halfway, validated nothing, offered no preview, and are unusable on a phone.
// Worse, the image host allow-list was enforced only on the server, so an
// author could fill in four prompts and learn on save that the host was never
// permitted.
//
// This validates against the same ALLOWED_MEDIA_DOMAINS the server enforces, so
// the rejection arrives while the URL is still in front of the author.
// ─────────────────────────────────────────────────────────────────────────────

export type MediaKind = "image" | "video";

interface Props {
  kind: MediaKind;
  open: boolean;
  onClose: () => void;
  onInsertImage: (v: { src: string; alt: string; caption: string; credit: string }) => void;
  onInsertVideo: (v: { src: string }) => void;
}

function imageError(raw: string): string | null {
  const value = raw.trim();
  if (!value) return "Enter an image URL.";

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return "That is not a valid URL.";
  }

  if (url.protocol !== "https:") return "Image URLs must use https.";

  if (!ALLOWED_MEDIA_DOMAINS.includes(url.hostname)) {
    // Naming the permitted hosts is the difference between a dead end and a
    // fixable problem -- the author usually just needs the other copy of the
    // same image.
    return `${url.hostname} is not an approved image host. Use one of: ${ALLOWED_MEDIA_DOMAINS.join(", ")}.`;
  }

  return null;
}

export function InsertMediaDialog({ kind, open, onClose, onInsertImage, onInsertVideo }: Props) {
  const [src, setSrc] = useState("");
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");
  const [credit, setCredit] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const firstFieldRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  // Reset between openings, otherwise the previous URL is still sitting there.
  useEffect(() => {
    if (open) {
      setSrc(""); setAlt(""); setCaption(""); setCredit("");
      setError(null); setTouched(false);
      returnFocusRef.current = document.activeElement as HTMLElement | null;
      // After paint, or the field is not yet in the document to focus.
      requestAnimationFrame(() => firstFieldRef.current?.focus());
    } else {
      // Put focus back where it came from; losing it to <body> strands anyone
      // navigating by keyboard.
      returnFocusRef.current?.focus?.();
    }
  }, [open]);

  // Escape to close, and keep Tab inside the dialog while it is open.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'button, input, textarea, [href], [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables?.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const videoId = kind === "video" ? parseYouTubeId(src) : null;
  const imageProblem = kind === "image" && touched ? imageError(src) : null;

  const submit = useCallback(() => {
    setTouched(true);

    if (kind === "image") {
      const problem = imageError(src);
      if (problem) { setError(problem); return; }
      onInsertImage({ src: src.trim(), alt: alt.trim(), caption: caption.trim(), credit: credit.trim() });
      onClose();
      return;
    }

    const id = parseYouTubeId(src);
    if (!id) {
      setError("That does not look like a YouTube video link. Paste a watch, youtu.be, shorts or embed URL.");
      return;
    }
    onInsertVideo({ src: src.trim() });
    onClose();
  }, [kind, src, alt, caption, credit, onInsertImage, onInsertVideo, onClose]);

  if (!open) return null;

  const isImage = kind === "image";
  const Icon = isImage ? ImagePlus : MonitorPlay;

  return (
    <div className="imd-scrim" onMouseDown={onClose} role="presentation">
      <div
        ref={panelRef}
        className="imd-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="imd-head">
          <h2 id={titleId} className="imd-title">
            <Icon className="w-4 h-4" aria-hidden="true" />
            {isImage ? "Insert image" : "Insert video"}
          </h2>
          <button type="button" onClick={onClose} className="imd-close" aria-label="Close">
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="imd-body">
          <label className="imd-field">
            <span className="imd-label">{isImage ? "Image URL" : "YouTube URL"}</span>
            <input
              ref={firstFieldRef}
              type="url"
              value={src}
              onChange={(e) => { setSrc(e.target.value); setError(null); }}
              onBlur={() => setTouched(true)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
              placeholder={isImage ? "https://images.pexels.com/photos/…" : "https://www.youtube.com/watch?v=…"}
              className="imd-input"
              aria-invalid={Boolean(error || imageProblem) || undefined}
              aria-describedby={error || imageProblem ? `${titleId}-err` : `${titleId}-hint`}
            />
          </label>

          {!error && !imageProblem && (
            <p id={`${titleId}-hint`} className="imd-hint">
              {isImage
                ? `Approved hosts: ${ALLOWED_MEDIA_DOMAINS.join(", ")}.`
                : "Watch, youtu.be, Shorts and embed links are all accepted."}
            </p>
          )}

          {(error || imageProblem) && (
            <p id={`${titleId}-err`} role="alert" className="imd-error">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{error || imageProblem}</span>
            </p>
          )}

          {/* Confirm the right thing is being inserted before it lands in the
              article, rather than after. */}
          {!isImage && videoId && (
            <div className="imd-preview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={youTubeThumbnail(videoId)} alt="" className="imd-preview-img" />
              <span className="imd-preview-note">Video found · {videoId}</span>
            </div>
          )}

          {isImage && (
            <>
              <label className="imd-field">
                <span className="imd-label">
                  Alt text <span className="imd-req">required for accessibility</span>
                </span>
                <input
                  type="text"
                  value={alt}
                  onChange={(e) => setAlt(e.target.value)}
                  placeholder="Describe the image for screen readers"
                  className="imd-input"
                />
              </label>

              <div className="imd-grid">
                <label className="imd-field">
                  <span className="imd-label">Caption</span>
                  <input type="text" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Optional" className="imd-input" />
                </label>
                <label className="imd-field">
                  <span className="imd-label">Credit</span>
                  <input type="text" value={credit} onChange={(e) => setCredit(e.target.value)} placeholder="Photographer / source" className="imd-input" />
                </label>
              </div>

              {src && !imageError(src) && (
                <div className="imd-preview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    className="imd-preview-img"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                  <span className="imd-preview-note">Preview</span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="imd-foot">
          <button type="button" onClick={onClose} className="imd-btn">Cancel</button>
          <button type="button" onClick={submit} className="imd-btn imd-btn-primary">
            {isImage ? "Insert image" : "Insert video"}
          </button>
        </div>
      </div>
    </div>
  );
}
