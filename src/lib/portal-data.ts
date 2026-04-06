export type DocumentKind = "canva" | "pdf" | "image";
export type ProjectStage = "concept" | "revision" | "construction" | "archived";
export type ProjectType = "House" | "Condo" | "Commercial";
export type RevisionStatus = "todo" | "doing" | "done";

export interface RevisionRoom {
  name: string;
  description: string;
}

export interface ProjectDocument {
  id: string;
  title: string;
  version: string;
  kind: DocumentKind;
  mimeType: string;
  updatedAt: string;
  summary: string;
  latest?: boolean;
  checked?: boolean;
  rooms?: RevisionRoom[];
  viewerUrl?: string;
  downloadUrl?: string;
  categoryId?: string;
}

export interface ProjectCategory {
  id: string;
  name: string;
}

export interface ProjectSection {
  id: string;
  title: string;
  description: string;
  categories: ProjectCategory[];
  items: ProjectDocument[];
}

export interface GalleryImage {
  id: string;
  src: string;
  caption: string;
}

export interface GalleryRoom {
  id: string;
  name: string;
  images: GalleryImage[];
}

export interface ProjectPresentationSlide {
  id: string;
  src: string;
  alt: string;
  title: string;
  subtitle: string;
  description: string;
}

export type TodoPriority = "low" | "medium" | "high";
export type TodoStatus = "pending" | "in-progress" | "completed";

export interface TodoItem {
  id: string;
  title: string;
  description?: string;
  status: TodoStatus;
  priority: TodoPriority;
  projectSlug?: string;
  createdAt: string;
  completedAt?: string;
}

export interface ClientProject {
  slug: string;
  code: string;
  title: string;
  clientName: string;
  projectType: ProjectType;
  location: string;
  stage: ProjectStage;
  revisionStatus: RevisionStatus;
  createdAt: string;
  updatedAt: string;
  retentionUntil: string;
  shareMode: string;
  viewerCount: number;
  overview: string;
  nextMilestone: string;
  ownerNote: string;
  area: string;
  year: string;
  heroImageUrl?: string;
  sections: ProjectSection[];
  gallery: GalleryRoom[];
}

const projects: ClientProject[] = [];
const defaultTodos: TodoItem[] = [];

export function getProjects() {
  return projects;
}

export function getProjectBySlug(slug: string) {
  return projects.find((project) => project.slug === slug);
}

export function getProjectDocument(project: ClientProject, documentId: string) {
  return project.sections
    .flatMap((section) => section.items)
    .find((item) => item.id === documentId);
}

function isProjectImageDocument(document: ProjectDocument) {
  return document.kind === "image" || document.mimeType.startsWith("image/");
}

export function getProjectPresentationSlides(
  project: ClientProject,
): ProjectPresentationSlide[] {
  const slides: ProjectPresentationSlide[] = [];

  if (hasUsableUrl(project.heroImageUrl)) {
    slides.push({
      id: "hero",
      src: project.heroImageUrl as string,
      alt: project.title,
      title: project.title,
      subtitle: "Hero image",
      description: project.overview,
    });
  }

  for (const section of project.sections) {
    let imageIndex = 0;

    for (const document of section.items) {
      if (!isProjectImageDocument(document)) {
        continue;
      }

      const src = hasUsableUrl(document.viewerUrl)
        ? (document.viewerUrl as string)
        : hasUsableUrl(document.downloadUrl)
          ? (document.downloadUrl as string)
          : "";

      if (!src) {
        continue;
      }

      imageIndex += 1;

      const roomNames = document.rooms
        ?.map((room) => room.name.trim())
        .filter(Boolean)
        .join(", ") ?? "";
      const title = document.title.trim() || `${section.title} ${imageIndex}`;
      const subtitle = [section.title, document.version.trim()].filter(Boolean).join(" • ");
      const description = [document.summary.trim(), roomNames].filter(Boolean).join(" • ");

      slides.push({
        id: `document:${document.id}`,
        src,
        alt: title,
        title,
        subtitle,
        description,
      });
    }
  }

  for (const room of project.gallery) {
    for (const image of room.images) {
      if (!hasUsableUrl(image.src)) {
        continue;
      }

      const title = image.caption.trim() || room.name.trim() || project.title;

      slides.push({
        id: `gallery:${room.id}:${image.id}`,
        src: image.src,
        alt: title,
        title,
        subtitle: room.name.trim() ? `Gallery • ${room.name.trim()}` : "Gallery",
        description: image.caption.trim() || "",
      });
    }
  }

  return slides;
}

export function getProjectDocumentCount(project: ClientProject) {
  return project.sections.reduce((count, section) => count + section.items.length, 0);
}

export function getLatestDocuments(project: ClientProject) {
  const marked = project.sections
    .flatMap((section) =>
      section.items.map((item) => ({ ...item, sectionTitle: section.title })),
    )
    .filter((item) => item.latest);

  if (marked.length > 0) {
    return marked;
  }

  return project.sections.flatMap((section) =>
    section.items.slice(0, 1).map((item) => ({ ...item, sectionTitle: section.title })),
  );
}

export function hasUsableUrl(url?: string) {
  return Boolean(url && !url.includes("REPLACE_ME"));
}

export function getDocumentPreviewUrl(
  project: ClientProject,
  document: ProjectDocument,
): string {
  if (hasUsableUrl(document.viewerUrl)) {
    return document.viewerUrl as string;
  }

  if (document.kind === "pdf" && hasUsableUrl(document.downloadUrl)) {
    return document.downloadUrl as string;
  }

  return `/preview/${project.slug}/${document.id}`;
}

export function formatPortalDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function getStageLabel(stage: ProjectStage) {
  switch (stage) {
    case "concept":
      return "Concept";
    case "revision":
      return "Revision";
    case "construction":
      return "Construction";
    case "archived":
      return "Archived";
  }
}

export function getProjectTypes(): ProjectType[] {
  return ["House", "Condo", "Commercial"];
}

export function getRevisionStatusLabel(status: RevisionStatus) {
  switch (status) {
    case "todo":
      return "Todo";
    case "doing":
      return "Doing";
    case "done":
      return "Done";
  }
}

export function getDefaultTodos(): TodoItem[] {
  return defaultTodos;
}

export function getTodoPriorityLabel(priority: TodoPriority) {
  switch (priority) {
    case "low":
      return "ต่ำ";
    case "medium":
      return "ปานกลาง";
    case "high":
      return "สูง";
  }
}

export function getTodoStatusLabel(status: TodoStatus) {
  switch (status) {
    case "pending":
      return "รอดำเนินการ";
    case "in-progress":
      return "กำลังทำ";
    case "completed":
      return "เสร็จแล้ว";
  }
}
