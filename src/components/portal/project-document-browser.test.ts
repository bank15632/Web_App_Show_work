import { describe, expect, it } from "vitest";

import {
  filterDocumentsByRevision,
  getNavigableSubCategories,
  getRevisionOptions,
  resolveDocumentBrowserState,
} from "@/components/portal/project-document-browser";
import type { ClientProject, ProjectCategory, ProjectSection } from "@/lib/portal-data";

function createSection(id: string, items: ProjectSection["items"]): ProjectSection {
  return {
    id,
    title: id,
    description: `${id} description`,
    categories: [],
    items,
  };
}

function createProject(sections: ProjectSection[]): ClientProject {
  return {
    slug: "sample-project",
    code: "SAMPLE",
    title: "Sample Project",
    clientName: "Sample Client",
    projectType: "Commercial",
    location: "Bangkok",
    stage: "revision",
    revisionStatus: "doing",
    createdAt: "2026-03-23T00:00:00.000Z",
    updatedAt: "2026-03-23T00:00:00.000Z",
    retentionUntil: "2026-03-23T00:00:00.000Z",
    shareMode: "Published snapshot",
    viewerCount: 0,
    overview: "Overview",
    nextMilestone: "",
    ownerNote: "",
    area: "300 sqm",
    year: "2026",
    heroImageUrl: "",
    sections,
    gallery: [],
  };
}

describe("resolveDocumentBrowserState", () => {
  it("shows only categories that have usable document links", () => {
    const project = createProject([
      createSection("mood-tone", [
        {
          id: "mood-doc-1",
          title: "Mood board",
          version: "Revise 01",
          kind: "pdf",
          mimeType: "",
          updatedAt: "2026-03-23T00:00:00.000Z",
          summary: "Draft without uploaded file",
          latest: true,
          checked: false,
          rooms: [],
          viewerUrl: "",
          downloadUrl: "",
        },
      ]),
      createSection("design", [
        {
          id: "design-doc-1",
          title: "Design Pack",
          version: "Revise 02",
          kind: "pdf",
          mimeType: "application/pdf",
          updatedAt: "2026-03-23T00:00:00.000Z",
          summary: "Latest design set",
          latest: true,
          checked: true,
          rooms: [],
          viewerUrl: "https://example.com/design",
          downloadUrl: "https://example.com/design.pdf",
        },
      ]),
      createSection("construction", []),
    ]);

    const state = resolveDocumentBrowserState(project);

    expect(state.categories.map((category) => category.id)).toEqual([
      "design",
    ]);
    expect(state.activeCategory?.id).toBe("design");
    expect(state.activeDocument?.id).toBe("design-doc-1");
  });

  it("falls back when the selected category has no usable document links", () => {
    const project = createProject([
      createSection("mood-tone", [
        {
          id: "mood-doc-1",
          title: "Mood board",
          version: "Revise 01",
          kind: "pdf",
          mimeType: "",
          updatedAt: "2026-03-23T00:00:00.000Z",
          summary: "Draft without uploaded file",
          latest: true,
          checked: false,
          rooms: [],
          viewerUrl: "",
          downloadUrl: "",
        },
      ]),
      createSection("design", [
        {
          id: "design-doc-1",
          title: "Design Pack",
          version: "Revise 02",
          kind: "pdf",
          mimeType: "application/pdf",
          updatedAt: "2026-03-23T00:00:00.000Z",
          summary: "Latest design set",
          latest: true,
          checked: true,
          rooms: [],
          viewerUrl: "https://example.com/design",
          downloadUrl: "https://example.com/design.pdf",
        },
      ]),
    ]);

    const state = resolveDocumentBrowserState(project, "mood-tone");

    expect(state.categories.map((category) => category.id)).toEqual(["design"]);
    expect(state.activeCategory?.id).toBe("design");
    expect(state.activeDocument?.id).toBe("design-doc-1");
  });

  it("keeps image-only categories visible and skips revision picker state", () => {
    const project = createProject([
      createSection("design", [
        {
          id: "design-image-1",
          title: "ComfyUI_00002_",
          version: "Revise 01",
          kind: "image",
          mimeType: "image/png",
          updatedAt: "2026-03-23T00:00:00.000Z",
          summary: "",
          latest: true,
          checked: false,
          rooms: [],
          viewerUrl: "/api/client-rooms/assets/asset-1",
          downloadUrl: "/api/client-rooms/assets/asset-1",
        },
      ]),
    ]);

    const state = resolveDocumentBrowserState(project);

    expect(state.categories.map((category) => category.id)).toEqual(["design"]);
    expect(state.activeCategory?.id).toBe("design");
    expect(state.activeDocument).toBeNull();
  });
});

describe("getNavigableSubCategories", () => {
  it("returns only categories that have image documents to scroll to", () => {
    const categories: ProjectCategory[] = [
      { id: "living", name: "Living Room" },
      { id: "bedroom", name: "Bedroom" },
      { id: "kitchen", name: "Kitchen" },
    ];

    const documents: ProjectSection["items"] = [
      {
        id: "img-1",
        title: "Living image",
        version: "Revise 01",
        kind: "image",
        mimeType: "image/png",
        updatedAt: "2026-03-23T00:00:00.000Z",
        summary: "",
        latest: true,
        checked: false,
        rooms: [],
        viewerUrl: "/api/client-rooms/assets/img-1",
        downloadUrl: "/api/client-rooms/assets/img-1",
        categoryId: "living",
      },
      {
        id: "pdf-1",
        title: "Bedroom PDF",
        version: "Revise 02",
        kind: "pdf",
        mimeType: "application/pdf",
        updatedAt: "2026-03-23T00:00:00.000Z",
        summary: "",
        latest: false,
        checked: false,
        rooms: [],
        viewerUrl: "https://example.com/bedroom",
        downloadUrl: "https://example.com/bedroom.pdf",
        categoryId: "bedroom",
      },
      {
        id: "img-2",
        title: "Uncategorized image",
        version: "Revise 03",
        kind: "image",
        mimeType: "image/png",
        updatedAt: "2026-03-23T00:00:00.000Z",
        summary: "",
        latest: false,
        checked: false,
        rooms: [],
        viewerUrl: "/api/client-rooms/assets/img-2",
        downloadUrl: "/api/client-rooms/assets/img-2",
      },
    ];

    expect(getNavigableSubCategories(categories, documents)).toEqual([
      { id: "living", name: "Living Room" },
    ]);
  });
});

describe("revision helpers", () => {
  const documents: ProjectSection["items"] = [
    {
      id: "rev-1-image",
      title: "Rev 01 image",
      version: "Revise 01",
      kind: "image",
      mimeType: "image/png",
      updatedAt: "2026-03-23T00:00:00.000Z",
      summary: "",
      latest: false,
      checked: false,
      rooms: [],
      viewerUrl: "/api/client-rooms/assets/rev-1-image",
      downloadUrl: "/api/client-rooms/assets/rev-1-image",
    },
    {
      id: "rev-2-pdf",
      title: "Rev 02 PDF",
      version: "Revise 02",
      kind: "pdf",
      mimeType: "application/pdf",
      updatedAt: "2026-03-24T00:00:00.000Z",
      summary: "",
      latest: true,
      checked: true,
      rooms: [],
      viewerUrl: "https://example.com/rev-2",
      downloadUrl: "https://example.com/rev-2.pdf",
    },
    {
      id: "rev-2-image",
      title: "Rev 02 image",
      version: "Revise 02",
      kind: "image",
      mimeType: "image/png",
      updatedAt: "2026-03-24T00:00:00.000Z",
      summary: "",
      latest: false,
      checked: false,
      rooms: [],
      viewerUrl: "/api/client-rooms/assets/rev-2-image",
      downloadUrl: "/api/client-rooms/assets/rev-2-image",
    },
  ];

  it("builds unique revision options in document order", () => {
    expect(getRevisionOptions(documents)).toEqual(["Revise 01", "Revise 02"]);
  });

  it("filters mixed documents down to one selected revision", () => {
    expect(
      filterDocumentsByRevision(documents, documents, "Revise 02").map((document) => document.id),
    ).toEqual(["rev-2-pdf", "rev-2-image"]);
  });
});
