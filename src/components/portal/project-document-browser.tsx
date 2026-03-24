"use client";

import { useCallback, useState } from "react";
import { Check, ChevronDown, ChevronRight, Download, Eye } from "lucide-react";

import {
  formatPortalDate,
  getDocumentPreviewUrl,
  hasUsableUrl,
  type ClientProject,
  type ProjectCategory,
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

type DocumentBrowserState = {
  categories: AvailableCategory[];
  activeCategory: AvailableCategory | null;
  activeDocument: ProjectDocument | null;
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
  const [activeCategoryId, setActiveCategoryId] = useState<string>("");
  const [activeDocumentId, setActiveDocumentId] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [expandedRevision, setExpandedRevision] = useState<string | null>(null);
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);

  const { categories, activeCategory, activeDocument } =
    resolveDocumentBrowserState(project, activeCategoryId, activeDocumentId);

  function handleCategoryChange(category: AvailableCategory) {
    setActiveCategoryId(category.id);
    setActiveDocumentId(getDefaultDocumentId(getBrowserDocuments(category.section.items)));
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

  const scrollToSubCategory = useCallback((subCatId: string) => {
    const element = document.getElementById(`subcat-${subCatId}`);
    if (element) {
      const headerOffset = 140;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: elementPosition - headerOffset, behavior: "smooth" });
    }
  }, []);

  if (!activeCategory) {
    return null;
  }

  const imageDocuments = getImageDocuments(activeCategory.section.items);
  const browserDocuments = getBrowserDocuments(activeCategory.section.items);
  const sectionCategories = activeCategory.section.categories ?? [];
  const hasSubCategories = sectionCategories.length > 0;

  function getRoomRevisionHistory(roomName: string) {
    return browserDocuments
      .filter((doc) => doc.rooms?.some((room) => room.name === roomName))
      .map((doc) => ({
        doc,
        room: doc.rooms!.find((room) => room.name === roomName)!,
        label: getRevisionLabel(browserDocuments, doc),
      }));
  }

  const previewUrl = activeDocument
    ? getDocumentPreviewUrl(project, activeDocument)
    : null;
  const hasDownload = hasUsableUrl(activeDocument?.downloadUrl);

  return (
    <section id="document-browser" className="border-t border-border">
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

          {hasSubCategories ? (
            <div className="flex items-center gap-3 overflow-x-auto pb-3">
              {sectionCategories.map((subCat) => (
                <button
                  key={subCat.id}
                  onClick={() => scrollToSubCategory(subCat.id)}
                  className="shrink-0 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  {subCat.name}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-14 xl:px-12">
        {imageDocuments.length > 0 ? (
          <ImageDocumentStack
            project={project}
            category={activeCategory}
            documents={imageDocuments}
            sectionCategories={sectionCategories}
          />
        ) : null}

        {activeDocument ? (
          <div className={imageDocuments.length > 0 ? "mt-12 space-y-6" : "space-y-6"}>
            <div className="relative">
              <button
                onClick={() => setDropdownOpen((value) => !value)}
                className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:border-foreground"
              >
                {getRevisionLabel(browserDocuments, activeDocument)}
                {activeDocument.checked ? (
                  <Check className="size-3.5 text-emerald-600" />
                ) : null}
                <ChevronDown
                  className={`size-4 text-muted-foreground transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {dropdownOpen ? (
                <div className="absolute left-0 top-full z-30 mt-2 w-full max-w-md overflow-hidden rounded-xl border border-border bg-background shadow-lg">
                  {browserDocuments.map((doc, index) => (
                    <div key={doc.id} className="border-b border-border last:border-b-0">
                      <div className="flex items-center">
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
                            {doc.checked ? <Check className="size-3" /> : null}
                          </span>
                          <span>{getRevisionLabel(browserDocuments, doc, index)}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatPortalDate(doc.updatedAt)}
                          </span>
                        </button>

                        {doc.rooms && doc.rooms.length > 0 ? (
                          <button
                            onClick={() => toggleRevisionExpand(doc.id)}
                            className="px-3 py-3 text-muted-foreground transition-colors hover:text-foreground"
                            aria-label="Show rooms"
                          >
                            <ChevronDown
                              className={`size-4 transition-transform ${expandedRevision === doc.id ? "rotate-180" : ""}`}
                            />
                          </button>
                        ) : null}
                      </div>

                      {expandedRevision === doc.id && doc.rooms ? (
                        <div className="border-t border-border bg-secondary/30">
                          {doc.rooms.map((room, index) => {
                            const roomKey = `${doc.id}:${room.name}`;
                            const isRoomExpanded = expandedRoom === roomKey;
                            const roomHistory = isRoomExpanded
                              ? getRoomRevisionHistory(room.name)
                              : [];

                            return (
                              <div
                                key={index}
                                className="border-b border-border/50 last:border-b-0"
                              >
                                <button
                                  onClick={() => toggleRoomExpand(roomKey)}
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

                                {isRoomExpanded && roomHistory.length > 0 ? (
                                  <div className="bg-secondary/20 px-4 pb-2">
                                    {roomHistory.map((entry) => (
                                      <button
                                        key={entry.doc.id}
                                        onClick={() => selectRevision(entry.doc)}
                                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs transition-colors hover:bg-secondary/60 ${
                                          entry.doc.id === activeDocumentId
                                            ? "bg-secondary/80 font-medium"
                                            : ""
                                        }`}
                                      >
                                        <span
                                          className={`flex size-4 shrink-0 items-center justify-center rounded border ${
                                            entry.doc.checked
                                              ? "border-emerald-500 bg-emerald-500 text-white"
                                              : "border-border bg-background"
                                          }`}
                                        >
                                          {entry.doc.checked ? (
                                            <Check className="size-2.5" />
                                          ) : null}
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
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div>
              <h2 className="font-display text-3xl font-medium tracking-tight md:text-4xl">
                {activeDocument.title}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {activeDocument.version} · Updated {formatPortalDate(activeDocument.updatedAt)}
              </p>
            </div>

            <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
              {activeDocument.summary}
            </p>

            {activeDocument.rooms && activeDocument.rooms.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {activeDocument.rooms.map((room, index) => (
                  <span
                    key={index}
                    className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs"
                  >
                    {room.name}
                    <span className="ml-1.5 text-muted-foreground">
                      {room.description}
                    </span>
                  </span>
                ))}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={previewUrl ?? "#"}
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
                Source: {getDocumentSourceLabel(activeDocument)}
              </span>
            </div>
          </div>
        ) : imageDocuments.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-secondary/30 px-6 py-10 md:px-8">
            <p className="text-[0.72rem] uppercase tracking-[0.24em] text-muted-foreground">
              {activeCategory.label}
            </p>
            <h2 className="mt-3 font-display text-3xl tracking-tight md:text-4xl">
              ยังไม่มีเอกสารที่เปิดได้ในหมวดนี้
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
              {activeCategory.section.description} เพิ่มไฟล์หรือลิงก์เอกสารจากหน้า
              CMS แล้วกด Publish อีกครั้ง
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ImageDocumentStack({
  project,
  category,
  documents,
  sectionCategories,
}: {
  project: ClientProject;
  category: AvailableCategory;
  documents: ProjectDocument[];
  sectionCategories: ProjectCategory[];
}) {
  const hasSubCategories = sectionCategories.length > 0;

  if (!hasSubCategories) {
    return (
      <div className="space-y-8">
        {documents.map((document, index) => (
          <ImageDocumentCard
            key={document.id}
            project={project}
            category={category}
            document={document}
            index={index}
          />
        ))}
      </div>
    );
  }

  // Group documents by category (preserve order from sectionCategories)
  const grouped: Array<{ cat: ProjectCategory; docs: ProjectDocument[] }> = [];
  const usedDocIds = new Set<string>();

  for (const cat of sectionCategories) {
    const catDocs = documents.filter((doc) => doc.categoryId === cat.id);
    if (catDocs.length > 0) {
      grouped.push({ cat, docs: catDocs });
      for (const doc of catDocs) usedDocIds.add(doc.id);
    }
  }

  // Uncategorized documents
  const uncategorized = documents.filter((doc) => !usedDocIds.has(doc.id));

  return (
    <div className="space-y-12">
      {grouped.map(({ cat, docs }) => (
        <div key={cat.id}>
          <h3
            id={`subcat-${cat.id}`}
            className="mb-6 border-b border-border pb-3 text-lg font-semibold"
          >
            {cat.name}
          </h3>
          <div className="space-y-8">
            {docs.map((document, index) => (
              <ImageDocumentCard
                key={document.id}
                project={project}
                category={category}
                document={document}
                index={index}
              />
            ))}
          </div>
        </div>
      ))}

      {uncategorized.length > 0 ? (
        <div>
          {grouped.length > 0 ? (
            <h3 className="mb-6 border-b border-border pb-3 text-lg font-semibold">
              อื่นๆ
            </h3>
          ) : null}
          <div className="space-y-8">
            {uncategorized.map((document, index) => (
              <ImageDocumentCard
                key={document.id}
                project={project}
                category={category}
                document={document}
                index={index}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ImageDocumentCard({
  project,
  category,
  document,
  index,
}: {
  project: ClientProject;
  category: AvailableCategory;
  document: ProjectDocument;
  index: number;
}) {
  const [infoOpen, setInfoOpen] = useState(false);
  const previewUrl = getDocumentPreviewUrl(project, document);
  const hasDownload = hasUsableUrl(document.downloadUrl);

  return (
    <figure className="space-y-2">
      <div className="group relative overflow-hidden rounded-3xl bg-secondary">
        <a href={previewUrl} target="_blank" rel="noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={document.title || `${category.label} ${index + 1}`}
            loading="lazy"
            decoding="async"
            className="block h-auto w-full"
          />
        </a>

        {hasDownload ? (
          <a
            href={document.downloadUrl}
            download
            className="absolute bottom-3 right-3 inline-flex size-10 items-center justify-center rounded-full bg-foreground/70 text-background backdrop-blur-sm transition-opacity hover:bg-foreground/90 md:opacity-0 md:group-hover:opacity-100"
            title="ดาวน์โหลดรูป"
          >
            <Download className="size-5" />
          </a>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => setInfoOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        {infoOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        {document.title || `${category.label} ${index + 1}`}
        {document.version ? (
          <span className="text-xs text-muted-foreground">· {document.version}</span>
        ) : null}
      </button>

      {infoOpen ? (
        <div className="space-y-2 pl-5">
          <p className="text-sm text-muted-foreground">
            Updated {formatPortalDate(document.updatedAt)}
          </p>
          {document.summary ? (
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {document.summary}
            </p>
          ) : null}
          {document.rooms && document.rooms.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {document.rooms.map((room, i) => (
                <span
                  key={i}
                  className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs"
                >
                  {room.name}
                  {room.description ? (
                    <span className="ml-1.5 text-muted-foreground">{room.description}</span>
                  ) : null}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </figure>
  );
}

export function resolveDocumentBrowserState(
  project: ClientProject,
  activeCategoryId?: string,
  activeDocumentId?: string,
): DocumentBrowserState {
  const categories = categoryConfig
    .map((category) => {
      const section = project.sections.find((item) => item.id === category.id);

      if (!section) {
        return null;
      }

      const visibleItems = getVisibleDocuments(section.items);

      if (visibleItems.length === 0) {
        return null;
      }

      return {
        ...category,
        section: {
          ...section,
          items: visibleItems,
        },
      };
    })
    .filter((item): item is AvailableCategory => item !== null);

  const activeCategory =
    categories.find((category) => category.id === activeCategoryId) ??
    categories[0] ??
    null;

  if (!activeCategory) {
    return {
      categories,
      activeCategory: null,
      activeDocument: null,
    };
  }

  const browserDocuments = getBrowserDocuments(activeCategory.section.items);
  const activeDocument =
    browserDocuments.find((item) => item.id === activeDocumentId) ??
    browserDocuments.find((item) => item.id === getDefaultDocumentId(browserDocuments)) ??
    null;

  return {
    categories,
    activeCategory,
    activeDocument,
  };
}

function getVisibleDocuments(documents: ProjectDocument[]) {
  return documents.filter(
    (document) =>
      hasUsableUrl(document.viewerUrl) || hasUsableUrl(document.downloadUrl),
  );
}

function getImageDocuments(documents: ProjectDocument[]) {
  return documents.filter((document) => isImageDocument(document));
}

function getBrowserDocuments(documents: ProjectDocument[]) {
  return documents.filter((document) => !isImageDocument(document));
}

function isImageDocument(document: ProjectDocument) {
  return document.kind === "image" || document.mimeType.startsWith("image/");
}

function getDocumentSourceLabel(document: ProjectDocument) {
  if (isImageDocument(document)) {
    return "Image";
  }

  if (document.kind === "canva") {
    return "Canva board";
  }

  return "PDF";
}

function getDefaultDocumentId(documents: ProjectDocument[]) {
  return documents.find((item) => item.latest)?.id ?? documents[0]?.id ?? "";
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
