"use client";

import { useCallback, useId, useRef, useState } from "react";
import { UploadCloud, Loader2, AlertCircle, ImageIcon } from "lucide-react";
import {
  UPLOAD_ACCEPT_ATTR,
  uploadError,
  formatBytes,
  MAX_UPLOAD_BYTES,
} from "@/lib/upload-constraints";

// ─────────────────────────────────────────────────────────────────────────────
// Drag-and-drop image upload
// ─────────────────────────────────────────────────────────────────────────────
//
// Shared by the article media dialog and the profile avatar field, so the two
// behave identically: same size limit, same accepted formats, same wording when
// something is refused.
//
// It is a button, not a div with a click handler. That is what makes it
// reachable by keyboard and announced as actionable -- a drop zone that only
// responds to a mouse is unusable for anyone navigating by tab, and drag and
// drop has no keyboard equivalent at all, so the file picker is the primary
// path rather than a fallback.
//
// Progress is deliberately indeterminate. A Server Action gives no upload
// progress events, so a percentage bar would be invented -- and a fake bar that
// sits at 90% is worse than an honest spinner.
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  /** Performs the upload. Resolves with a URL or an error message. */
  onUpload: (file: File) => Promise<{ ok: boolean; url?: string; error?: string }>;
  onUploaded: (url: string) => void;
  /** Rendered inside the zone when idle. */
  label?: string;
  hint?: string;
  disabled?: boolean;
}

export default function ImageDropzone({
  onUpload,
  onUploaded,
  label = "Drop an image here, or click to choose",
  hint,
  disabled,
}: Props) {
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = useId();

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      // Checked here so an obviously-wrong file never leaves the machine. The
      // server repeats every one of these against the actual bytes.
      const clientError = uploadError(file);
      if (clientError) {
        setError(clientError);
        return;
      }

      setFileName(file.name);
      setBusy(true);
      try {
        const result = await onUpload(file);
        if (result.ok && result.url) {
          onUploaded(result.url);
        } else {
          setError(result.error ?? "The upload failed.");
        }
      } catch {
        // A thrown action usually means the network dropped mid-request.
        setError("The upload failed. Check your connection and try again.");
      } finally {
        setBusy(false);
      }
    },
    [onUpload, onUploaded]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (disabled || busy) return;
      const file = e.dataTransfer.files?.[0];
      if (file) void handleFile(file);
    },
    [disabled, busy, handleFile]
  );

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !busy) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        disabled={disabled || busy}
        aria-describedby={error ? errorId : undefined}
        className="dz"
        data-dragging={dragging ? "true" : undefined}
        data-busy={busy ? "true" : undefined}
      >
        {busy ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
            <span className="dz-label">Uploading{fileName ? ` ${fileName}` : ""}…</span>
            {/* aria-live so the outcome is announced, not just shown. */}
            <span className="sr-only" role="status" aria-live="polite">
              Uploading
            </span>
          </>
        ) : (
          <>
            {dragging ? (
              <ImageIcon className="w-5 h-5" aria-hidden="true" />
            ) : (
              <UploadCloud className="w-5 h-5" aria-hidden="true" />
            )}
            <span className="dz-label">{dragging ? "Release to upload" : label}</span>
            <span className="dz-hint">
              {hint ?? `JPEG, PNG, WebP or GIF · up to ${formatBytes(MAX_UPLOAD_BYTES)}`}
            </span>
          </>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={UPLOAD_ACCEPT_ATTR}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          // Reset so choosing the same file twice in a row still fires change --
          // otherwise a retry after an error appears to do nothing.
          e.target.value = "";
          if (file) void handleFile(file);
        }}
      />

      {error && (
        <p id={errorId} role="alert" className="dz-error">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
