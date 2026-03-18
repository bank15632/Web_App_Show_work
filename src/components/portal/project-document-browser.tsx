"use client";

import { useState } from "react";
import { Download, Eye } from "lucide-react";

import { DocumentPreview } from "@/components/portal/document-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatPortalDate,
  getDocumentPreviewUrl,
  hasUsableUrl,
  type ClientProject,
  type ProjectDocument,
  type ProjectSection,
} from "@/lib/portal-data";
import { cn } from "@/lib/utils";

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
      <div className="sticky top-[73px] z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-5 md:px-8 xl:px-12">
          <div className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3 overflow-x-auto">
              <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCategoryChange(category)}
                    className={cn(
                      "rounded-none border-b border-transparent px-2 pb-1 pt-0 text-sm text-muted-foreground hover:bg-transparent hover:text-foreground",
                      activeCategory.id === category.id &&
                        "border-foreground text-foreground",
                    )}
                  >
                    {category.label}
                  </Button>
                ))}
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              เลือกหมวดก่อน แล้วค่อยเลือก revision ของหมวดนั้น
            </p>
          </div>

          <div className="border-t border-border py-3">
            <div className="flex items-center gap-2 overflow-x-auto">
              {activeCategory.section.items.map((document, index) => (
                <Button
                  key={document.id}
                  variant={document.id === activeDocument.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveDocumentId(document.id)}
                  className={cn(
                    "shrink-0 rounded-full px-4",
                    document.id === activeDocument.id &&
                      "border-foreground bg-foreground text-background hover:bg-foreground/90",
                  )}
                >
                  {getRevisionLabel(activeCategory.section.items, document, index)}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-14 xl:px-12">
        <div className="grid gap-8 lg:grid-cols-[0.36fr_0.64fr] lg:items-start">
          <div className="space-y-5">
            <div className="space-y-3">
              <p className="text-[0.72rem] uppercase tracking-[0.28em] text-muted-foreground">
                Selected document
              </p>
              <h2 className="font-display text-4xl leading-none md:text-5xl">
                {activeCategory.label}
              </h2>
            </div>

            <div className="rounded-[2rem] border border-border bg-card p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="h-7 rounded-full px-3">
                  {getRevisionLabel(activeCategory.section.items, activeDocument)}
                </Badge>
                <Badge variant="outline" className="h-7 rounded-full px-3">
                  {activeDocument.kind === "canva" ? "Canva" : "PDF"}
                </Badge>
                <Badge variant="secondary" className="h-7 rounded-full px-3">
                  {activeDocument.version}
                </Badge>
              </div>

              <div className="mt-5">
                <h3 className="font-display text-3xl leading-tight">
                  {activeDocument.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Updated {formatPortalDate(activeDocument.updatedAt)}
                </p>
              </div>

              <p className="mt-5 text-sm leading-7 text-muted-foreground">
                {activeDocument.summary}
              </p>

              <div className="mt-6 grid gap-px overflow-hidden rounded-[1.5rem] border border-border bg-border sm:grid-cols-2">
                <BrowserMeta label="Client" value={project.clientName} />
                <BrowserMeta label="Location" value={project.location} />
                <BrowserMeta label="Category" value={activeCategory.label} />
                <BrowserMeta label="Share mode" value={project.shareMode} />
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
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
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-border bg-card">
            <DocumentPreview
              title={activeDocument.title}
              summary={activeDocument.summary}
              kind={activeDocument.kind}
              previewUrl={previewUrl}
              className="min-h-[22rem] rounded-none border-0 bg-secondary/55 md:min-h-[36rem]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function BrowserMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card p-4">
      <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-foreground">{value}</p>
    </div>
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
