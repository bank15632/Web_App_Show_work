import { z } from "zod";

import type { ClientRoomDraftData, ClientRoomSectionId } from "@/lib/client-rooms/types";
import { clientRoomSectionTemplates } from "@/lib/client-rooms/types";

const sectionIdValues = clientRoomSectionTemplates.map((section) => section.id) as [
  ClientRoomSectionId,
  ...ClientRoomSectionId[],
];

const revisionRoomSchema = z.object({
  name: z.string().trim().max(120).default(""),
  description: z.string().trim().max(300).default(""),
});

const documentSchema = z.object({
  id: z.string().trim().min(1).max(80),
  title: z.string().trim().max(200).default(""),
  version: z.string().trim().max(80).default(""),
  kind: z.enum(["canva", "pdf", "image"]).default("pdf"),
  mimeType: z.string().trim().max(200).default(""),
  updatedAt: z.string().trim().max(40).default(""),
  summary: z.string().trim().max(2000).default(""),
  latest: z.boolean().default(false),
  checked: z.boolean().default(false),
  rooms: z.array(revisionRoomSchema).default([]),
  viewerUrl: z.string().trim().max(2000).default(""),
  downloadUrl: z.string().trim().max(2000).default(""),
  categoryId: z.string().trim().max(80).default(""),
});

const categorySchema = z.object({
  id: z.string().trim().min(1).max(80),
  name: z.string().trim().max(120).default(""),
});

const sectionSchema = z.object({
  id: z.enum(sectionIdValues),
  title: z.string().trim().max(120).default(""),
  description: z.string().trim().max(400).default(""),
  categories: z.array(categorySchema).default([]),
  items: z.array(documentSchema).default([]),
});

const galleryImageSchema = z.object({
  id: z.string().trim().min(1).max(80),
  src: z.string().trim().max(2000).default(""),
  caption: z.string().trim().max(300).default(""),
});

const galleryRoomSchema = z.object({
  id: z.string().trim().min(1).max(80),
  name: z.string().trim().max(120).default(""),
  images: z.array(galleryImageSchema).default([]),
});

export const clientRoomDraftSchema = z.object({
  slug: z.string().trim().max(120).default(""),
  title: z.string().trim().min(1).max(200),
  clientName: z.string().trim().max(200).default(""),
  projectType: z.enum(["House", "Condo", "Commercial"]).default("House"),
  location: z.string().trim().max(200).default(""),
  area: z.string().trim().max(80).default(""),
  year: z.string().trim().max(40).default(""),
  overview: z.string().trim().max(4000).default(""),
  heroImageUrl: z.string().trim().max(2000).default(""),
  sections: z.array(sectionSchema).default([]),
  gallery: z.array(galleryRoomSchema).default([]),
});

export const clientRoomCreateSchema = z.object({
  title: z.string().trim().max(200).default("Untitled Client Room"),
});

export function normalizeClientRoomDraft(
  input: ClientRoomDraftData,
): ClientRoomDraftData {
  const sectionsById = new Map(input.sections.map((section) => [section.id, section]));

  return {
    ...input,
    sections: clientRoomSectionTemplates.map((section) => {
      const existing = sectionsById.get(section.id);
      return {
        id: section.id,
        title: existing?.title || section.title,
        description: existing?.description || section.description,
        categories: existing?.categories ?? [],
        items: existing?.items ?? [],
      };
    }),
  };
}
