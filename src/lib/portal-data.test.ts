import { describe, expect, it } from "vitest";

import {
  getProjectPresentationSlides,
  type ClientProject,
} from "@/lib/portal-data";

function createProject(): ClientProject {
  return {
    slug: "sample-project",
    code: "SAMPLE",
    title: "Sample Project",
    clientName: "Sample Client",
    projectType: "House",
    location: "Bangkok",
    stage: "revision",
    revisionStatus: "doing",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    retentionUntil: "2026-12-31T00:00:00.000Z",
    shareMode: "Published snapshot",
    viewerCount: 0,
    overview: "Project overview",
    nextMilestone: "",
    ownerNote: "",
    area: "500 sqm",
    year: "2026",
    heroImageUrl: "https://example.com/hero.jpg",
    sections: [
      {
        id: "design",
        title: "Design",
        description: "",
        categories: [],
        items: [
          {
            id: "image-1",
            title: "Living Room",
            version: "Revise 01",
            kind: "image",
            mimeType: "image/jpeg",
            updatedAt: "2026-01-02T00:00:00.000Z",
            summary: "Main design shot",
            viewerUrl: "https://example.com/design-1.jpg",
            downloadUrl: "",
          },
          {
            id: "pdf-1",
            title: "Spec PDF",
            version: "Revise 01",
            kind: "pdf",
            mimeType: "application/pdf",
            updatedAt: "2026-01-02T00:00:00.000Z",
            summary: "",
            viewerUrl: "https://example.com/spec.pdf",
            downloadUrl: "https://example.com/spec.pdf",
          },
          {
            id: "image-2",
            title: "",
            version: "Revise 02",
            kind: "image",
            mimeType: "image/png",
            updatedAt: "2026-01-03T00:00:00.000Z",
            summary: "",
            viewerUrl: "",
            downloadUrl: "https://example.com/design-2.png",
            rooms: [
              {
                name: "Bedroom",
                description: "",
              },
            ],
          },
        ],
      },
    ],
    gallery: [
      {
        id: "gallery-room",
        name: "Master Bedroom",
        images: [
          {
            id: "gallery-1",
            src: "https://example.com/gallery-1.jpg",
            caption: "Night scene",
          },
          {
            id: "gallery-2",
            src: "",
            caption: "Placeholder",
          },
        ],
      },
    ],
  };
}

describe("getProjectPresentationSlides", () => {
  it("returns hero, image documents, and gallery images in display order", () => {
    const slides = getProjectPresentationSlides(createProject());

    expect(slides.map((slide) => slide.id)).toEqual([
      "hero",
      "document:image-1",
      "document:image-2",
      "gallery:gallery-room:gallery-1",
    ]);
  });

  it("filters out non-image documents and empty gallery images", () => {
    const slides = getProjectPresentationSlides(createProject());

    expect(slides.find((slide) => slide.id === "document:pdf-1")).toBeUndefined();
    expect(slides.find((slide) => slide.id === "gallery:gallery-room:gallery-2")).toBeUndefined();
  });

  it("builds useful fallback metadata for untitled image documents", () => {
    const slides = getProjectPresentationSlides(createProject());
    const fallbackSlide = slides.find((slide) => slide.id === "document:image-2");

    expect(fallbackSlide).toMatchObject({
      title: "Design 2",
      subtitle: "Design • Revise 02",
      description: "Bedroom",
    });
  });
});
