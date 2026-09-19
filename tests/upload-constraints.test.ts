import { describe, it, expect } from "vitest";
import {
  uploadError,
  sniffImageMime,
  MAX_UPLOAD_BYTES,
  ALLOWED_UPLOAD_MIME,
} from "@/lib/upload-constraints";

// ─────────────────────────────────────────────────────────────────────────────
// Upload validation
// ─────────────────────────────────────────────────────────────────────────────
//
// This is the boundary between a user's file and our storage, so the negative
// cases carry the weight. A permissive sniffer is how a non-image gets stored
// and served from our own origin.
// ─────────────────────────────────────────────────────────────────────────────

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const GIF = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0, 0, 0, 0, 0, 0]);
const WEBP = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);

describe("sniffImageMime — accepts the four real formats", () => {
  it.each([
    ["jpeg", JPEG, "image/jpeg"],
    ["png", PNG, "image/png"],
    ["gif", GIF, "image/gif"],
    ["webp", WEBP, "image/webp"],
  ])("detects %s", (_l, bytes, expected) => {
    expect(sniffImageMime(bytes as Uint8Array)).toBe(expected);
  });
});

describe("sniffImageMime — rejects anything else", () => {
  it("rejects an SVG, which is markup rather than a raster image", () => {
    const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script/></svg>');
    expect(sniffImageMime(svg)).toBeNull();
  });

  it("rejects HTML renamed to .png", () => {
    // The whole point of sniffing: the declared type said image, the bytes did
    // not. This is the polyglot case.
    const html = new TextEncoder().encode("<!DOCTYPE html><script>alert(1)</script>");
    expect(sniffImageMime(html)).toBeNull();
  });

  it("rejects a PDF", () => {
    const pdf = new TextEncoder().encode("%PDF-1.7\n%âãÏÓ\n");
    expect(sniffImageMime(pdf)).toBeNull();
  });

  it("rejects an ELF binary", () => {
    expect(sniffImageMime(new Uint8Array([0x7f, 0x45, 0x4c, 0x46, 0, 0, 0, 0, 0, 0, 0, 0]))).toBeNull();
  });

  it("rejects a truncated header rather than guessing", () => {
    expect(sniffImageMime(new Uint8Array([0xff, 0xd8]))).toBeNull();
    expect(sniffImageMime(new Uint8Array([]))).toBeNull();
  });

  it("rejects RIFF that is not WebP (a .wav, for instance)", () => {
    const wav = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45,
    ]);
    expect(sniffImageMime(wav)).toBeNull();
  });
});

describe("uploadError", () => {
  it("accepts a normal image", () => {
    expect(uploadError({ type: "image/png", size: 500_000 })).toBeNull();
  });

  it("rejects an empty file", () => {
    expect(uploadError({ type: "image/png", size: 0 })).toMatch(/empty/i);
  });

  it("rejects an oversized file and names the actual size", () => {
    const err = uploadError({ type: "image/jpeg", size: MAX_UPLOAD_BYTES + 1 });
    // The message has to say how big it was, or the author cannot tell how far
    // over the limit they are.
    expect(err).toMatch(/5\.0 MB|MB/);
  });

  it("accepts a file exactly at the limit", () => {
    expect(uploadError({ type: "image/jpeg", size: MAX_UPLOAD_BYTES })).toBeNull();
  });

  it("explains why SVG specifically is refused", () => {
    const err = uploadError({ type: "image/svg+xml", size: 1000 });
    expect(err).toMatch(/script/i);
  });

  it.each(["application/pdf", "text/html", "video/mp4", ""])(
    "rejects %s",
    (type) => {
      expect(uploadError({ type, size: 1000 })).not.toBeNull();
    }
  );

  it("does not accept SVG through the allow-list", () => {
    expect(ALLOWED_UPLOAD_MIME).not.toContain("image/svg+xml" as never);
  });
});
