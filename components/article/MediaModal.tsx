"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export interface MediaSummary {
  label: string;
  value: ReactNode;
  color?: string;
}

interface MediaModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  media: ReactNode;
  summary: MediaSummary[];
}

export default function MediaModal({ open, onClose, title, media, summary }: MediaModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex h-full w-full flex-col overflow-hidden bg-black/95 backdrop-blur-sm md:flex-row"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative flex min-h-[50vh] flex-1 items-center justify-center overflow-hidden p-4 md:min-h-0 md:p-8">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close full view"
          className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <X size={22} />
        </button>
        <div className="max-h-full max-w-full text-white w-full overflow-x-auto overflow-y-hidden touch-pan-x no-scrollbar">
          <div className="min-w-[600px] w-full flex justify-center">{media}</div>
        </div>
      </div>

      <aside className="h-[50vh] w-full shrink-0 overflow-y-auto border-t border-neutral-800 bg-neutral-900 p-6 text-white md:h-full md:w-[400px] md:border-l md:border-t-0">
        <h2 className="mb-5 pr-10 text-lg font-semibold">{title}</h2>
        {summary.length > 0 ? (
          <table className="w-full text-left text-sm">
            <tbody>
              {summary.map((item) => (
                <tr key={item.label} className="border-b border-neutral-800 align-top last:border-0">
                  <th scope="row" className="w-2/5 py-3 pr-3 font-semibold" style={{ color: item.color || 'var(--muted)' }}>{item.label}</th>
                  <td className="break-words py-3 font-semibold" style={{ color: item.color || '#f5f5f5' }}>{item.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-neutral-400">No summary data available.</p>
        )}
      </aside>
    </div>,
    document.body
  );
}
