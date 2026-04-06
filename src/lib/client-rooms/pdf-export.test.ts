import { describe, expect, it } from "vitest";

import {
  getPdfPageFormat,
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

describe("getPdfPageFormat", () => {
  it("matches the page size to the image size for wide images", () => {
    expect(getPdfPageFormat(1600, 900)).toEqual({
      width: 1600,
      height: 900,
    });
  });

  it("matches the page size to the image size for tall images", () => {
    expect(getPdfPageFormat(900, 1600)).toEqual({
      width: 900,
      height: 1600,
    });
  });
});
