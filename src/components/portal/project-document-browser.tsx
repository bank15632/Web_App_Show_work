"use client";

import { useState } from "react";
import { Check, ChevronDown, Download, Eye } from "lucide-react";

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

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [expandedRevision, setExpandedRevision] = useState<string | null>(null);
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);

  function handleCategoryChange(category: AvailableCategory) {
    setActiveCategoryId(category.id);
    setActiveDocumentId(getDefaultDocumentId(category.section));
    setDropdownOpen(false);
    setExpandedRevision(null);
    setExpandedRoom(null);
  }

  function selectRevision(doc: ProjectDocument) {
    setActiveDocumentId(doc.id);
    setDropdownOpen(false);
    setExpandedRevision(null);
    setExpandedRoom(null);
  }

  function toggleRevisionExpand(docId: string) {
    setExpandedRevision((prev) => (prev === docId ? null : docId));
    setExpandedRoom(null);
  }

  function toggleRoomExpand(roomName: string) {
    setExpandedRoom((prev) => (prev === roomName ? null : roomName));
  }

  function getRoomRevisionHistory(roomName: string) {
    if (!activeCategory) return [];
    return activeCategory.section.items
      .filter((doc) => doc.rooms?.some((r) => r.name === roomName))
      .map((doc) => ({
        doc,
        room: doc.rooms!.find((r) => r.name === roomName)!,
        label: getRevisionLabel(activeCategory.section.items, doc),
      }));
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

      {/* Document content */}
      <div className="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-14 xl:px-12">
        <div className="space-y-6">
          {/* Revision dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:border-foreground"
            >
              {getRevisionLabel(activeCategory.section.items, activeDocument)}
              {activeDocument.checked && (
                <Check className="size-3.5 text-emerald-600" />
              )}
              <ChevronDown
                className={`size-4 text-muted-foreground transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown panel */}
            {dropdownOpen && (
              <div className="absolute left-0 top-full z-30 mt-2 w-full max-w-md overflow-hidden rounded-xl border border-border bg-background shadow-lg">
                {activeCategory.section.items.map((doc, index) => (
                  <div key={doc.id} className="border-b border-border last:border-b-0">
                    {/* Revision row */}
                    <div className="flex items-center">
                      {/* Checkbox area — click to select */}
                      <button
                        onClick={() => selectRevision(doc)}
                        className={`flex flex-1 items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-secondary/50 ${
                          doc.id === activeDocument.id ? "bg-secondary/80 font-medium" : ""
                        }`}
                      >
                        <span
                          className={`flex size-5 shrink-0 items-center justify-center rounded border ${
                            doc.checked
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-border bg-background"
                          }`}
                        >
                          {doc.checked && <Check className="size-3" />}
                        </span>
                        <span>
                          {getRevisionLabel(activeCategory.section.items, doc, index)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatPortalDate(doc.updatedAt)}
                        </span>
                      </button>

                      {/* Expand rooms */}
                      {doc.rooms && doc.rooms.length > 0 && (
                        <button
                          onClick={() => toggleRevisionExpand(doc.id)}
                          className="px-3 py-3 text-muted-foreground transition-colors hover:text-foreground"
                          aria-label="Show rooms"
                        >
                          <ChevronDown
                            className={`size-4 transition-transform ${expandedRevision === doc.id ? "rotate-180" : ""}`}
                          />
                        </button>
                      )}
                    </div>

                    {/* Expanded rooms — each room is a sub-dropdown */}
                    {expandedRevision === doc.id && doc.rooms && (
                      <div className="border-t border-border bg-secondary/30">
                        {doc.rooms.map((room, ri) => {
                          const isRoomExpanded = expandedRoom === `${doc.id}:${room.name}`;
                          const roomHistory = isRoomExpanded ? getRoomRevisionHistory(room.name) : [];

                          return (
                            <div key={ri} className="border-b border-border/50 last:border-b-0">
                              <button
                                onClick={() => toggleRoomExpand(`${doc.id}:${room.name}`)}
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-secondary/50"
                              >
                                <ChevronDown
                                  className={`size-3.5 shrink-0 text-muted-foreground transition-transform ${isRoomExpanded ? "rotate-180" : ""}`}
                                />
                                <span className="font-medium">{room.name}</span>
                                <span className="text-muted-foreground">
                                  {room.description}
                                </span>
                              </button>

                              {/* Room revision history */}
                              {isRoomExpanded && roomHistory.length > 0 && (
                                <div className="bg-secondary/20 px-4 pb-2">
                                  {roomHistory.map((entry) => (
                                    <button
                                      key={entry.doc.id}
                                      onClick={() => selectRevision(entry.doc)}
                                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs transition-colors hover:bg-secondary/60 ${
                                        entry.doc.id === activeDocumentId ? "bg-secondary/80 font-medium" : ""
                                      }`}
                                    >
                                      <span
                                        className={`flex size-4 shrink-0 items-center justify-center rounded border ${
                                          entry.doc.checked
                                            ? "border-emerald-500 bg-emerald-500 text-white"
                                            : "border-border bg-background"
                                        }`}
                                      >
                                        {entry.doc.checked && <Check className="size-2.5" />}
                                      </span>
                                      <span>{entry.label}</span>
                                      <span className="text-muted-foreground">
                                        {entry.room.description}
                                      </span>
                                      <span className="ml-auto text-muted-foreground">
                                        {formatPortalDate(entry.doc.updatedAt)}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

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

          {/* Rooms in this revision */}
          {activeDocument.rooms && activeDocument.rooms.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {activeDocument.rooms.map((room, i) => (
                <span
                  key={i}
                  className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs"
                >
                  {room.name}
                  <span className="ml-1.5 text-muted-foreground">
                    {room.description}
                  </span>
                </span>
              ))}
            </div>
          )}

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
