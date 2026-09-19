"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { ZoomIn, ZoomOut, RotateCw, X, Check, Loader2, AlertCircle } from "lucide-react";
import {
  normaliseCropArea,
  exportSize,
  isLowResolution,
  type PixelArea,
} from "@/lib/crop";

// ─────────────────────────────────────────────────────────────────────────────
// Avatar cropper
// ─────────────────────────────────────────────────────────────────────────────
//
// Previously the chosen file went straight to Cloudinary, which cropped to a
// square on whatever it detected as a face. That is a reasonable default and a
// poor guarantee: group photos, profiles in the corner of a landscape shot, and
// anything without a clear face all get framed by a heuristic the author cannot
// see or override. This puts the decision back with the person whose byline it
// is.
//
// The crop happens in the browser, before upload. Two reasons: the author sees
// exactly what they will get, and only the cropped square crosses the wire
// rather than a multi-megabyte original.
//
// react-easy-crop rather than hand-rolled pointer maths — pinch-zoom, wheel,
// touch and drag bounds are a lot of subtle code to get right, and getting them
// subtly wrong is worse than not offering the feature.
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  /** Object URL of the file being cropped. */
  imageSrc: string;
  /** Original filename, so the cropped file keeps a recognisable name. */
  fileName: string;
  open: boolean;
  onCancel: () => void;
  onCropped: (file: File) => void;
  /** True while the parent is uploading the result. */
  busy?: boolean;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

/**
 * Draw the selected region to a canvas and return it as a file.
 *
 * Exported as PNG when the source has transparency is not worth detecting here:
 * an avatar is composited onto a solid circle either way, and JPEG at 0.92 is
 * materially smaller than PNG for a photograph. The server re-encodes through
 * Cloudinary regardless, so this format is a transport decision, not a storage
 * one.
 */
async function renderCrop(
  imageSrc: string,
  area: PixelArea,
  rotation: number,
  fileName: string
): Promise<File> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    // The source is a blob: URL from the user's own file, so this is not a
    // cross-origin fetch; the attribute keeps the canvas untainted regardless.
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("The image could not be read."));
    img.src = imageSrc;
  });

  const safe = normaliseCropArea(area, { width: image.naturalWidth, height: image.naturalHeight });
  if (!safe) throw new Error("That selection is empty. Drag to choose part of the photo.");

  const size = exportSize(safe);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser could not process the image.");

  // Rotation is applied by drawing the source rotated about the canvas centre.
  // Without this the crop region and the displayed image disagree the moment
  // the user rotates, and the exported square is taken from the wrong place.
  if (rotation % 360 !== 0) {
    const rad = (rotation * Math.PI) / 180;
    ctx.translate(size / 2, size / 2);
    ctx.rotate(rad);
    ctx.translate(-size / 2, -size / 2);
  }

  ctx.imageSmoothingQuality = "high";
  // Source rectangle (the framed region) -> destination rectangle (the whole
  // square canvas). The nine-argument form is the only one that crops.
  ctx.drawImage(
    image,
    safe.x,
    safe.y,
    safe.width,
    safe.height,
    0,
    0,
    size,
    size
  );

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.92)
  );
  if (!blob) throw new Error("The cropped image could not be created.");

  const base = fileName.replace(/\.[^.]+$/, "") || "avatar";
  return new File([blob], `${base}-cropped.jpg`, { type: "image/jpeg" });
}

export default function AvatarCropper({
  imageSrc,
  fileName,
  open,
  onCancel,
  onCropped,
  busy,
}: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [area, setArea] = useState<Area | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lowRes, setLowRes] = useState(false);
  const [working, setWorking] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      returnFocusRef.current?.focus?.();
      return;
    }
    returnFocusRef.current = document.activeElement as HTMLElement | null;
  }, [open]);

  // Escape to cancel, and keep Tab inside the dialog.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (!busy && !working) onCancel();
        return;
      }
      if (e.key !== "Tab") return;

      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input, [href], [tabindex]:not([tabindex="-1"])'
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
  }, [open, onCancel, busy, working]);

  const onMediaLoaded = useCallback((media: { naturalWidth: number; naturalHeight: number }) => {
    // Warn rather than refuse: a 200px photo still makes a usable avatar, it
    // just will not be sharp on a high-density screen, and the author is better
    // placed than we are to decide whether that matters.
    setLowRes(isLowResolution({ width: media.naturalWidth, height: media.naturalHeight }));
  }, []);

  const apply = useCallback(async () => {
    if (!area) return;
    setError(null);
    setWorking(true);
    try {
      const file = await renderCrop(imageSrc, area, rotation, fileName);
      onCropped(file);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The image could not be cropped.");
    } finally {
      setWorking(false);
    }
  }, [area, imageSrc, rotation, fileName, onCropped]);

  if (!open) return null;

  const disabled = busy || working;

  return (
    <div className="imd-scrim" onMouseDown={() => !disabled && onCancel()} role="presentation">
      <div
        ref={panelRef}
        className="imd-panel crop-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="imd-head">
          <h2 id={titleId} className="imd-title">Position your photo</h2>
          <button
            type="button"
            onClick={onCancel}
            className="imd-close"
            aria-label="Cancel cropping"
            disabled={disabled}
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="crop-stage">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            cropShape="round"
            showGrid={false}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={(_a, pixels) => setArea(pixels)}
            onMediaLoaded={onMediaLoaded}
            // Restrict to the image so the circle can never contain empty space.
            restrictPosition
          />
        </div>

        <div className="crop-controls">
          <div className="crop-zoom">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - 0.2).toFixed(2)))}
              className="crop-btn"
              aria-label="Zoom out"
              disabled={disabled || zoom <= MIN_ZOOM}
            >
              <ZoomOut className="w-4 h-4" aria-hidden="true" />
            </button>

            {/* A real slider, not just buttons: it is the only control here that
                a keyboard user can operate continuously, since dragging the
                image itself has no keyboard equivalent. */}
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="crop-slider"
              aria-label="Zoom"
              disabled={disabled}
            />

            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.2).toFixed(2)))}
              className="crop-btn"
              aria-label="Zoom in"
              disabled={disabled || zoom >= MAX_ZOOM}
            >
              <ZoomIn className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="crop-btn"
            aria-label="Rotate 90 degrees"
            disabled={disabled}
          >
            <RotateCw className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {lowRes && !error && (
          <p className="crop-note">
            This photo is small, so the result may look soft on high-resolution screens.
          </p>
        )}

        {error && (
          <p role="alert" className="dz-error crop-note-error">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </p>
        )}

        <div className="imd-foot">
          <button type="button" onClick={onCancel} className="imd-btn" disabled={disabled}>
            Cancel
          </button>
          <button
            type="button"
            onClick={apply}
            className="imd-btn imd-btn-primary"
            disabled={disabled || !area}
          >
            {disabled ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                {busy ? "Uploading…" : "Cropping…"}
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                Use photo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
