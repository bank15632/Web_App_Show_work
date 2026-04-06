import { describe, expect, it } from "vitest";

import {
  getPdfImageCoverPlacement,
  getPdfPageOrientation,
} from "@/lib/client-rooms/pdf-export";

describe("getPdfPageOrientation", () => {
  it("uses landscape for wide images", () => {
    expect(getPdfPageOrientation(1600, 900)).toBe("landscape");
  });

  it("uses portrait for tall images", () => {
    expect(getPdfPageOrientation(900, 1600)).toBe("portrait");
  });
});

describe("getPdfImageCoverPlacement", () => {
  it("fills the full page height for wide images and crops horizontally", () => {
    const placement = getPdfImageCoverPlacement(297, 210, 1600, 900);

    expect(placement.height).toBe(210);
    expect(placement.width).toBeGreaterThan(297);
    expect(placement.x).toBeLessThan(0);
    expect(placement.y).toBe(0);
  });

  it("fills the full page width for tall images and crops vertically", () => {
    const placement = getPdfImageCoverPlacement(210, 297, 900, 1600);

    expect(placement.width).toBe(210);
    expect(placement.height).toBeGreaterThan(297);
    expect(placement.x).toBe(0);
    expect(placement.y).toBeLessThan(0);
  });

  it("matches the page exactly when image and page ratios align", () => {
    const placement = getPdfImageCoverPlacement(297, 210, 2970, 2100);

    expect(placement.x).toBeCloseTo(0, 6);
    expect(placement.y).toBeCloseTo(0, 6);
    expect(placement.width).toBeCloseTo(297, 6);
    expect(placement.height).toBeCloseTo(210, 6);
  });
});
