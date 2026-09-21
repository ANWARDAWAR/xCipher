"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { ZoomIn, ZoomOut, RotateCw, X, Check, Loader2, AlertCircle } from "lucide-react";
import {
  normaliseCropArea,
  type PixelArea,
} from "@/lib/crop";

interface Props {
  imageSrc: string;
  fileName: string;
  open: boolean;
  onCancel: () => void;
  onCropped: (file: File) => void;
  busy?: boolean;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ASPECT_RATIO = 16 / 10;
const MAX_WIDTH = 1200;

async function renderThumbnailCrop(
  imageSrc: string,
  area: PixelArea,
  rotation: number,
  fileName: string
): Promise<File> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("The image could not be read."));
    img.src = imageSrc;
  });

  const safe = normaliseCropArea(area, { width: image.naturalWidth, height: image.naturalHeight });
  if (!safe) throw new Error("That selection is empty. Drag to choose part of the photo.");

  // Target size respects aspect ratio and maximum width
  const outWidth = Math.min(MAX_WIDTH, safe.width);
  const outHeight = Math.round(outWidth / ASPECT_RATIO);

  const canvas = document.createElement("canvas");
  canvas.width = outWidth;
  canvas.height = outHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser could not process the image.");

  if (rotation % 360 !== 0) {
    const rad = (rotation * Math.PI) / 180;
    ctx.translate(outWidth / 2, outHeight / 2);
    ctx.rotate(rad);
    ctx.translate(-outWidth / 2, -outHeight / 2);
  }

  ctx.imageSmoothingQuality = "high";
  
  ctx.drawImage(
    image,
    safe.x,
    safe.y,
    safe.width,
    safe.height,
    0,
    0,
    outWidth,
    outHeight
  );

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.92)
  );
  if (!blob) throw new Error("The cropped image could not be created.");

  const base = fileName.replace(/\.[^.]+$/, "") || "thumbnail";
  return new File([blob], `${base}-cropped.jpg`, { type: "image/jpeg" });
}

export default function ThumbnailCropper({
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

  const apply = useCallback(async () => {
    if (!area) return;
    setError(null);
    setWorking(true);
    try {
      const file = await renderThumbnailCrop(imageSrc, area, rotation, fileName);
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
        style={{ maxWidth: "800px" }}
      >
        <div className="imd-head">
          <h2 id={titleId} className="imd-title">Position thumbnail</h2>
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

        <div className="crop-stage" style={{ height: "400px" }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={ASPECT_RATIO}
            cropShape="rect"
            showGrid={true}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={(_a, pixels) => setArea(pixels)}
            restrictPosition
          />
        </div>

        <div className="crop-controls">
          <div className="crop-zoom">
            <button
              type="button"
              className="crop-btn"
              onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - 0.25))}
              disabled={disabled || zoom <= MIN_ZOOM}
              aria-label="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <input
              type="range"
              value={zoom}
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              aria-label="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              disabled={disabled}
              className="crop-slider"
            />
            <button
              type="button"
              className="crop-btn"
              onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + 0.25))}
              disabled={disabled || zoom >= MAX_ZOOM}
              aria-label="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            className="crop-btn"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            disabled={disabled}
            aria-label="Rotate 90 degrees"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="crop-err" role="alert">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="crop-act">
          <button
            type="button"
            className="btn-cs ghost"
            onClick={onCancel}
            disabled={disabled}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-cs"
            onClick={apply}
            disabled={disabled || !area}
          >
            {working || busy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                Working...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-1.5" />
                Apply crop
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
