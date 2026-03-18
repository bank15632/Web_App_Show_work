"use client";

import { useState } from "react";
import { Download, Eye } from "lucide-react";

import {
  formatPortalDate,
  getDocumentPreviewUrl,
  hasUsableUrl,
  type ClientProject,
  type ProjectDocument,
  type ProjectSection,
} from "@/lib/portal-data";

type CategoryId = "mood-tone" | "design" | "construction" | "boq" | "timeline";

type CategoryConfig = {
  id: CategoryId;
  label: string;
};

type AvailableCategory = CategoryConfig & {
  section: ProjectSection;
};

const categoryConfig: CategoryConfig[] = [
  { id: "mood-tone", label: "Mood & Tone" },
  { id: "design", label: "Design" },
  { id: "construction", label: "Construction drawing" },
  { id: "boq", label: "BOQ" },
  { id: "timeline", label: "Timeline" },
];

export function ProjectDocumentBrowser({
  project,
}: {
  project: ClientProject;
}) {
  const categories = categoryConfig
    .map((category) => {
      const section = project.sections.find((item) => item.id === category.id);

      if (!section) {
        return null;
      }

      return {
        ...category,
        section,
      };
    })
    .filter((item): item is AvailableCategory => item !== null);

  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    categories[0]?.id ?? "",
  );
  const activeCategory =
    categories.find((category) => category.id === activeCategoryId) ??
    categories[0];

  const [activeDocumentId, setActiveDocumentId] = useState<string>(
    activeCategory ? getDefaultDocumentId(activeCategory.section) : "",
  );

  function handleCategoryChange(category: AvailableCategory) {
    setActiveCategoryId(category.id);
    setActiveDocumentId(getDefaultDocumentId(category.section));
  }

  if (!activeCategory) {
    return null;
  }

  const activeDocument =
    activeCategory.section.items.find((item) => item.id === activeDocumentId) ??
    activeCategory.section.items[0];

  if (!activeDocument) {
    return null;
  }

  const previewUrl = getDocumentPreviewUrl(project, activeDocument);
  const hasDownload = hasUsableUrl(activeDocument.downloadUrl);

  return (
    <section id="document-browser" className="border-t border-border">
      {/* Category tabs — clean underline style */}
      <div className="sticky top-[73px] z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-5 md:px-8 xl:px-12">
          <div className="flex items-center gap-8 overflow-x-auto py-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category)}
                className={`shrink-0 border-b-2 pb-1 text-sm transition-colors ${
                  activeCategory.id === category.id
                    ? "border-foreground font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Revision selector */}
      <div className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-5 py-3 md:px-8 xl:px-12">
          {activeCategory.section.items.map((document, index) => (
            <button
              key={document.id}
              onClick={() => setActiveDocumentId(document.id)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm transition-colors ${
                document.id === activeDocument.id
                  ? "bg-foreground font-medium text-background"
                  : "border border-border text-muted-foreground hover:border-foreground hover:text-foreground"
              }`}
            >
              {getRevisionLabel(activeCategory.section.items, document, index)}
            </button>
          ))}
        </div>
      </div>

      {/* Document content */}
      <div className="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-14 xl:px-12">
        <div className="space-y-6">
          {/* Title + meta */}
          <div>
            <h2 className="font-display text-3xl font-medium tracking-tight md:text-4xl">
              {activeDocument.title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {activeDocument.version} · Updated{" "}
              {formatPortalDate(activeDocument.updatedAt)}
            </p>
          </div>

          <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
            {activeDocument.summary}
          </p>

          {/* Action buttons + source */}
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-foreground bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
            >
              <Eye className="size-4" />
              เปิดดูบนเว็บ
            </a>

            {hasDownload ? (
              <a
                href={activeDocument.downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                <Download className="size-4" />
                ดาวน์โหลด PDF
              </a>
            ) : null}

            <span className="text-sm text-muted-foreground">
              Source: {activeDocument.kind === "canva" ? "Canva board" : "PDF"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function getDefaultDocumentId(section: ProjectSection) {
  return section.items.find((item) => item.latest)?.id ?? section.items[0]?.id ?? "";
}

function getRevisionLabel(
  documents: ProjectDocument[],
  document: ProjectDocument,
  index?: number,
) {
  const match = document.version.match(/(\d+)/);

  if (match) {
    return `Revise ${match[1].padStart(2, "0")}`;
  }

  const safeIndex =
    typeof index === "number"
      ? index
      : documents.findIndex((item) => item.id === document.id);
  const fallbackNumber = String(documents.length - safeIndex).padStart(2, "0");

  return `Revise ${fallbackNumber}`;
}
