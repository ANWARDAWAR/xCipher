// ─────────────────────────────────────────────────────────────────────────────
// Upload constraints
// ─────────────────────────────────────────────────────────────────────────────
//
// One definition of what an acceptable upload is, shared by the browser and the
// server actions.
//
// The client copy exists to give immediate feedback -- rejecting a 40MB file
// before it crosses the wire is the difference between an instant error and a
// long upload that fails at the end. It is a convenience, never the control:
// every rule here is re-checked server-side against the actual bytes, because
// anything the browser reports can be forged.
//
// No imports, so this is unit-testable without a database, a DOM or a network.
// ─────────────────────────────────────────────────────────────────────────────

/** 5MB. Generous for a photograph, small enough that a mistaken video upload
 *  fails fast rather than tying up a request for a minute. */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** MIME types accepted at the boundary.
 *
 *  SVG is deliberately excluded. It is an image to a user and a script host to
 *  a browser: an <svg> can carry <script> and event handlers, and serving one
 *  from our own domain would run it in our origin. Raster only. */
export const ALLOWED_UPLOAD_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export type AllowedUploadMime = (typeof ALLOWED_UPLOAD_MIME)[number];

/** For the file picker's accept attribute. Advisory only -- a user can always
 *  choose "all files" in the OS dialog, which is why the checks below run
 *  regardless. */
export const UPLOAD_ACCEPT_ATTR = ALLOWED_UPLOAD_MIME.join(",");

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Validate a file's declared type and size.
 *
 * Returns a human-readable reason or null. The message names the actual
 * problem -- "that file is 12.4 MB" rather than "invalid file" -- because the
 * fix is different for each and the author cannot guess which applies.
 */
export function uploadError(file: { type: string; size: number; name?: string }): string | null {
  if (!file.size) return "That file is empty.";

  if (!ALLOWED_UPLOAD_MIME.includes(file.type as AllowedUploadMime)) {
    // Called out by name: SVG is the one people reach for expecting it to work.
    if (file.type === "image/svg+xml") {
      return "SVG files are not accepted because they can carry scripts. Export a PNG or WebP instead.";
    }
    return `${file.type || "That file type"} is not an image we accept. Use JPEG, PNG, WebP or GIF.`;
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return `That image is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_UPLOAD_BYTES)}.`;
  }

  return null;
}

/**
 * Identify a raster image from its leading bytes.
 *
 * The server does not trust the declared MIME type: a browser reports whatever
 * the OS guessed from the file extension, and a crafted request can claim
 * anything at all. These are the magic numbers for the four formats we accept,
 * so a file renamed to .png is caught here rather than being stored and served
 * as an image that is not one.
 */
export function sniffImageMime(bytes: Uint8Array): AllowedUploadMime | null {
  if (bytes.length < 12) return null;

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  // GIF: "GIF87a" or "GIF89a"
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return "image/gif";

  // WebP: "RIFF" .... "WEBP"
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

/** Longest edge for a stored article image. A 6000px camera original is
 *  pointless on a page whose measure is 712px, and it is the single biggest
 *  contributor to a slow article. */
export const MAX_IMAGE_WIDTH = 1920;

/** WebP quality. 80 is the usual point where further reduction starts showing
 *  on photographs. */
export const WEBP_QUALITY = 80;
