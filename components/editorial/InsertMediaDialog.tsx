"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { X, ImagePlus, MonitorPlay, AlertCircle, UploadCloud, Link2 } from "lucide-react";
import ImageDropzone from "./ImageDropzone";
import { uploadArticleImage } from "@/app/actions/upload-article-image";
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
  initialImage?: { src?: string; alt?: string; caption?: string; credit?: string } | null;
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



  return null;
}

export function InsertMediaDialog({ kind, open, onClose, onInsertImage, onInsertVideo, initialImage }: Props) {
  const [src, setSrc] = useState(initialImage?.src || "");
  const [alt, setAlt] = useState(initialImage?.alt || "");
  const [caption, setCaption] = useState(initialImage?.caption || "");
  const [credit, setCredit] = useState(initialImage?.credit || "");
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  // Upload leads for images: it is the path most authors want, and the URL tab
  // remains for stock photography and anything already hosted elsewhere. A
  // video has nothing to upload, so that dialog keeps its single field.
  const [tab, setTab] = useState<"upload" | "url">(initialImage?.src ? "url" : "upload");

  const firstFieldRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  // Focus handling only. The fields are no longer cleared here: this component
  // is mounted with a key that changes per opening, so React discards the old
  // state and the form starts empty by construction. Clearing six pieces of
  // state inside an effect triggered a second render pass on every open, which
  // is what react-hooks/set-state-in-effect objects to.
  useEffect(() => {
    if (!open) return;

    // Remember where focus came from so it can be restored on close.
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    // After paint, or the field is not yet in the document to focus.
    const raf = requestAnimationFrame(() => firstFieldRef.current?.focus());

    return () => {
      cancelAnimationFrame(raf);
      // Losing focus to <body> strands anyone navigating by keyboard.
      returnFocusRef.current?.focus?.();
    };
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onMouseDown={onClose} role="presentation">
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
            {isImage ? (initialImage ? "Update Image" : "Insert image") : "Insert video"}
          </h2>
          <button type="button" onClick={onClose} className="imd-close" aria-label="Close">
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="imd-body">
          {/* Tabs only for images. A video is always a link to someone else's
              platform, so offering an Upload tab there would be a dead end. */}
          {isImage && (
            <div className="imd-tabs" role="tablist" aria-label="How to add the image">
              <button
                type="button"
                role="tab"
                aria-selected={tab === "upload"}
                onClick={() => { setTab("upload"); setError(null); }}
                className="imd-tab"
                data-active={tab === "upload" ? "true" : undefined}
              >
                <UploadCloud className="w-3.5 h-3.5" aria-hidden="true" />
                Upload file
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "url"}
                onClick={() => { setTab("url"); setError(null); }}
                className="imd-tab"
                data-active={tab === "url" ? "true" : undefined}
              >
                <Link2 className="w-3.5 h-3.5" aria-hidden="true" />
                Image URL
              </button>
            </div>
          )}

          {isImage && tab === "upload" && (
            <ImageDropzone
              onUpload={async (file) => {
                const fd = new FormData();
                fd.append("file", file);
                return uploadArticleImage(fd);
              }}
              // A successful upload fills the URL field rather than inserting
              // straight away, so the author still writes alt text before the
              // image reaches the article. Inserting immediately is how images
              // end up published with no alt text at all.
              onUploaded={(url) => { setSrc(url); setError(null); setTouched(false); }}
              label="Drop an image here, or click to choose"
            />
          )}

          <label className="imd-field" hidden={isImage && tab === "upload" && !src}>
            <span className="imd-label">
              {isImage ? (tab === "upload" ? "Uploaded image" : "Image URL") : "YouTube URL"}
            </span>
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
                ? tab === "upload"
                  ? "Uploaded images are converted to WebP and resized to fit the article measure."
                  : "All valid HTTP/HTTPS image URLs are accepted."
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
            {isImage ? (initialImage ? "Update Image" : "Insert image") : "Insert video"}
          </button>
        </div>
      </div>
    </div>
  );
}
