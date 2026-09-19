// ─────────────────────────────────────────────────────────────────────────────
// Crop geometry
// ─────────────────────────────────────────────────────────────────────────────
//
// The arithmetic behind the avatar cropper, kept apart from the component so it
// can be tested without a DOM or a canvas.
//
// react-easy-crop reports the selected region in the *source image's* pixel
// space, which is what we want, but it reports it as floats and does not clamp
// to the image bounds — a fast drag at the edge can hand back a negative origin
// or a width that runs past the right edge. Passing either to
// canvas.drawImage() produces a silently transparent band rather than an error,
// so the clamping below is what stops a user getting a photo with a blank strip
// down one side.
// ─────────────────────────────────────────────────────────────────────────────

export interface PixelArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

/** Longest edge of the exported crop.
 *
 *  512 matches the square Cloudinary already stores, so the upload is not
 *  re-scaled twice. Larger would be discarded on arrival; smaller would visibly
 *  soften on a high-density display. */
export const AVATAR_EXPORT_SIZE = 512;

/**
 * Clamp a reported crop region to the image, and round to whole pixels.
 *
 * Returns null when nothing usable remains — a zero-area region, or one that
 * falls entirely outside the source. The caller treats that as "no crop" rather
 * than drawing an empty canvas.
 */
export function normaliseCropArea(area: PixelArea, image: Dimensions): PixelArea | null {
  if (image.width <= 0 || image.height <= 0) return null;

  // Round before clamping: a float origin of 0.4 with a width of 99.8 would
  // otherwise clamp against the un-rounded value and drift by a pixel.
  const x = Math.round(area.x);
  const y = Math.round(area.y);
  const w = Math.round(area.width);
  const h = Math.round(area.height);

  if (w <= 0 || h <= 0) return null;

  const left = Math.max(0, Math.min(x, image.width));
  const top = Math.max(0, Math.min(y, image.height));

  // Trim rather than shift. Moving a region that overhangs the right edge back
  // into bounds would silently crop a different part of the photo than the one
  // the user framed.
  const right = Math.min(left + w, image.width);
  const bottom = Math.min(top + h, image.height);

  const width = right - left;
  const height = bottom - top;

  if (width <= 0 || height <= 0) return null;

  return { x: left, y: top, width, height };
}

/**
 * Output size for a square crop.
 *
 * Never enlarges. Cropping a small region out of an already-small photo and
 * then scaling it up to 512 adds bytes and invents detail that is not there;
 * the honest result is the smaller square.
 */
export function exportSize(crop: PixelArea, max: number = AVATAR_EXPORT_SIZE): number {
  const shortest = Math.min(crop.width, crop.height);
  return Math.max(1, Math.min(max, Math.round(shortest)));
}

/**
 * Whether a source image is large enough to be worth cropping.
 *
 * Below the export size the cropper still works, but the result will be
 * upscaled by whatever displays it, so the UI warns rather than silently
 * producing something soft.
 */
export function isLowResolution(image: Dimensions, target: number = AVATAR_EXPORT_SIZE): boolean {
  return Math.min(image.width, image.height) < target;
}
