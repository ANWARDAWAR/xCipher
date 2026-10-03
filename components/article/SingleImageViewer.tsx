"use client";

import { useState } from "react";
import { Maximize } from "lucide-react";
import MediaModal, { type MediaSummary } from "./MediaModal";

interface SingleImageViewerProps {
  src: string;
  alt?: string;
  caption?: string;
  credit?: string;
}

export default function SingleImageViewer({ src, alt = "", caption, credit }: SingleImageViewerProps) {
  const [open, setOpen] = useState(false);
  const summary: MediaSummary[] = [
    { label: "Caption", value: caption || "—" },
    { label: "Alt text", value: alt || "—" },
    { label: "Credit", value: credit || "—" },
  ];

  return (
    <>
      <figure className="group relative my-6">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative block w-full cursor-zoom-in text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          aria-label={`View image full screen: ${alt || "image"}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} title={caption} loading="lazy" className="h-auto w-full" />
          <span className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-black/65 text-white opacity-100 shadow transition md:opacity-0 md:group-hover:opacity-100">
            <Maximize size={18} />
          </span>
        </button>
        {(caption || credit) && (
          <figcaption className="mt-2 text-center text-sm text-[var(--muted)]">
            {caption && <span>{caption}</span>}
            {credit && (
              <span className="mt-1 block text-[10px] uppercase tracking-wider text-[var(--muted)]">
                Image Credit: {credit}
              </span>
            )}
          </figcaption>
        )}
      </figure>
      <MediaModal
        open={open}
        onClose={() => setOpen(false)}
        title={caption || alt || "Image full view"}
        media={
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} className="max-h-[calc(50vh-2rem)] max-w-full object-contain md:max-h-[calc(100vh-4rem)]" />
        }
        summary={summary}
      />
    </>
  );
}
