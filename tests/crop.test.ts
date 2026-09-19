import { describe, it, expect } from "vitest";
import {
  normaliseCropArea,
  exportSize,
  isLowResolution,
  AVATAR_EXPORT_SIZE,
} from "@/lib/crop";

const IMG = { width: 1000, height: 800 };

describe("normaliseCropArea — the ordinary case", () => {
  it("passes a region that already fits", () => {
    expect(normaliseCropArea({ x: 100, y: 50, width: 400, height: 400 }, IMG)).toEqual({
      x: 100, y: 50, width: 400, height: 400,
    });
  });

  it("rounds float coordinates to whole pixels", () => {
    // drawImage accepts floats and resamples; whole pixels keep the result crisp.
    expect(normaliseCropArea({ x: 10.4, y: 20.6, width: 99.5, height: 99.5 }, IMG)).toEqual({
      x: 10, y: 21, width: 100, height: 100,
    });
  });
});

describe("normaliseCropArea — regions that would draw a blank band", () => {
  it("clamps a negative origin", () => {
    // A fast drag past the top-left. Left alone, canvas fills the overhang with
    // transparent pixels instead of erroring.
    const out = normaliseCropArea({ x: -50, y: -30, width: 200, height: 200 }, IMG);
    expect(out).toEqual({ x: 0, y: 0, width: 200, height: 200 });
  });

  it("trims a region overhanging the right edge", () => {
    const out = normaliseCropArea({ x: 900, y: 0, width: 300, height: 300 }, IMG);
    // Trimmed to the image, not shifted left — shifting would frame a different
    // part of the photo than the one the user chose.
    expect(out).toEqual({ x: 900, y: 0, width: 100, height: 300 });
  });

  it("trims a region overhanging the bottom edge", () => {
    expect(normaliseCropArea({ x: 0, y: 700, width: 200, height: 400 }, IMG)).toEqual({
      x: 0, y: 700, width: 200, height: 100,
    });
  });

  it("handles overhang on both axes at once", () => {
    expect(normaliseCropArea({ x: 950, y: 750, width: 500, height: 500 }, IMG)).toEqual({
      x: 950, y: 750, width: 50, height: 50,
    });
  });
});

describe("normaliseCropArea — nothing usable", () => {
  it.each([
    ["zero width", { x: 0, y: 0, width: 0, height: 100 }],
    ["zero height", { x: 0, y: 0, width: 100, height: 0 }],
    ["negative size", { x: 0, y: 0, width: -10, height: -10 }],
    ["entirely right of the image", { x: 1000, y: 0, width: 100, height: 100 }],
    ["entirely below the image", { x: 0, y: 800, width: 100, height: 100 }],
    ["sub-pixel region", { x: 0, y: 0, width: 0.2, height: 0.2 }],
  ])("returns null for %s", (_label, area) => {
    expect(normaliseCropArea(area, IMG)).toBeNull();
  });

  it("returns null for a degenerate source image", () => {
    expect(normaliseCropArea({ x: 0, y: 0, width: 10, height: 10 }, { width: 0, height: 0 })).toBeNull();
  });
});

describe("exportSize", () => {
  it("caps at the export size for a large crop", () => {
    expect(exportSize({ x: 0, y: 0, width: 2000, height: 2000 })).toBe(AVATAR_EXPORT_SIZE);
  });

  it("does not enlarge a small crop", () => {
    // Upscaling would add bytes and invent detail that is not in the source.
    expect(exportSize({ x: 0, y: 0, width: 120, height: 120 })).toBe(120);
  });

  it("uses the shorter edge when the region is not square", () => {
    expect(exportSize({ x: 0, y: 0, width: 900, height: 300 })).toBe(300);
  });

  it("never returns zero", () => {
    expect(exportSize({ x: 0, y: 0, width: 0.4, height: 0.4 })).toBe(1);
  });
});

describe("isLowResolution", () => {
  it("flags an image smaller than the export size", () => {
    expect(isLowResolution({ width: 300, height: 900 })).toBe(true);
  });

  it("accepts one at or above it", () => {
    expect(isLowResolution({ width: 512, height: 512 })).toBe(false);
    expect(isLowResolution({ width: 4000, height: 3000 })).toBe(false);
  });
});
