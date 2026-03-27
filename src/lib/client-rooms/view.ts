import type { ClientProject } from "@/lib/portal-data";
import type { ClientRoomProjectRecord } from "@/lib/client-rooms/types";

export function toPortalProject(project: ClientRoomProjectRecord): ClientProject {
  const snapshot = project.publishedData ?? project.draftData;

  return {
    slug: project.shareToken ?? project.slug,
    code: project.slug.replace(/-/g, "").slice(0, 6).toUpperCase(),
    title: snapshot.title,
    clientName: snapshot.clientName,
    projectType: snapshot.projectType,
    location: snapshot.location,
    stage: "revision",
    revisionStatus: "doing",
    createdAt: project.createdAt,
    updatedAt: project.publishedAt ?? project.updatedAt,
    retentionUntil: project.publishedAt ?? project.updatedAt,
    shareMode: "Published snapshot",
    viewerCount: 0,
    overview: snapshot.overview,
    nextMilestone: "",
    ownerNote: "",
    area: snapshot.area,
    year: snapshot.year,
    heroImageUrl: snapshot.heroImageUrl,
    sections: snapshot.sections.map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description,
      categories: section.categories ?? [],
      items: section.items.map((item) => ({
        ...item,
        rooms: item.rooms ?? [],
        mimeType: item.mimeType ?? "",
        viewerUrl: item.viewerUrl || undefined,
        downloadUrl: item.downloadUrl || undefined,
        categoryId: item.categoryId || undefined,
      })),
    })),
    gallery: snapshot.gallery,
  };
}
