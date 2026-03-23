import { describe, expect, it } from "vitest";

import { resolveDocumentBrowserState } from "@/components/portal/project-document-browser";
import type { ClientProject, ProjectSection } from "@/lib/portal-data";

function createSection(id: string, items: ProjectSection["items"]): ProjectSection {
  return {
    id,
    title: id,
    description: `${id} description`,
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
  it("falls back to the first category that has documents", () => {
    const project = createProject([
      createSection("mood-tone", []),
      createSection("design", [
        {
          id: "design-doc-1",
          title: "Design Pack",
          version: "Revise 02",
          kind: "pdf",
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
      "mood-tone",
      "design",
      "construction",
    ]);
    expect(state.activeCategory?.id).toBe("design");
    expect(state.activeDocument?.id).toBe("design-doc-1");
  });

  it("keeps an explicitly selected empty category active", () => {
    const project = createProject([
      createSection("mood-tone", []),
      createSection("design", [
        {
          id: "design-doc-1",
          title: "Design Pack",
          version: "Revise 02",
          kind: "pdf",
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

    expect(state.activeCategory?.id).toBe("mood-tone");
    expect(state.activeDocument).toBeNull();
  });
});
