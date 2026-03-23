export type ClientRoomDocumentKind = "canva" | "pdf" | "image";
export type ClientRoomProjectType = "House" | "Condo" | "Commercial";
export type ClientRoomSectionId =
  | "mood-tone"
  | "design"
  | "construction"
  | "boq"
  | "timeline";
export type ClientRoomAssetKind = "hero" | "gallery" | "document";

export interface ClientRoomRevisionRoom {
  name: string;
  description: string;
}

export interface ClientRoomDocument {
  id: string;
  title: string;
  version: string;
  kind: ClientRoomDocumentKind;
  mimeType: string;
  updatedAt: string;
  summary: string;
  latest: boolean;
  checked: boolean;
  rooms: ClientRoomRevisionRoom[];
  viewerUrl: string;
  downloadUrl: string;
}

export interface ClientRoomSection {
  id: ClientRoomSectionId;
  title: string;
  description: string;
  items: ClientRoomDocument[];
}

export interface ClientRoomGalleryImage {
  id: string;
  src: string;
  caption: string;
}

export interface ClientRoomGalleryRoom {
  id: string;
  name: string;
  images: ClientRoomGalleryImage[];
}

export interface ClientRoomDraftData {
  slug: string;
  title: string;
  clientName: string;
  projectType: ClientRoomProjectType;
  location: string;
  area: string;
  year: string;
  overview: string;
  heroImageUrl: string;
  sections: ClientRoomSection[];
  gallery: ClientRoomGalleryRoom[];
}

export interface ClientRoomProjectRecord {
  id: string;
  slug: string;
  title: string;
  clientName: string;
  shareToken: string | null;
  draftData: ClientRoomDraftData;
  publishedData: ClientRoomDraftData | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface ClientRoomProjectSummary {
  id: string;
  slug: string;
  title: string;
  clientName: string;
  projectType: ClientRoomProjectType;
  location: string;
  year: string;
  overview: string;
  documentCount: number;
  shareToken: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface ClientRoomAssetRecord {
  id: string;
  projectId: string;
  kind: ClientRoomAssetKind;
  fileName: string;
  objectKey: string;
  mimeType: string;
  createdAt: string;
}

export const clientRoomSectionTemplates: Array<{
  id: ClientRoomSectionId;
  title: string;
  description: string;
}> = [
  {
    id: "mood-tone",
    title: "Mood & Tone",
    description: "ภาพรวมอารมณ์ วัสดุ และทิศทางงานก่อนเข้ารายละเอียดแบบจริง",
  },
  {
    id: "design",
    title: "Design",
    description: "ไฟล์นำเสนอ layout, material direction และภาพรวมของแต่ละ space",
  },
  {
    id: "construction",
    title: "Construction Drawing",
    description: "ไฟล์หน้างานที่ลูกค้าและผู้รับเหมาควรเปิดดูจากเว็บหรือโหลดเป็น PDF ได้",
  },
  {
    id: "boq",
    title: "BOQ",
    description: "รายการวัสดุและประมาณราคาเพื่อใช้ดู scope และงบประมาณของแต่ละ revision",
  },
  {
    id: "timeline",
    title: "Timeline",
    description: "แผนงานก่อสร้างหรือ timeline ของโปรเจกต์",
  },
];

export function buildClientRoomAssetUrl(assetId: string) {
  return `/api/client-rooms/assets/${assetId}`;
}

export function buildClientRoomSharePath(shareToken: string) {
  return `/client-room/${shareToken}`;
}

export function createClientRoomId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

export function createEmptyClientRoomDocument(
  kind: ClientRoomDocumentKind = "pdf",
): ClientRoomDocument {
  return {
    id: createClientRoomId("doc"),
    title: "",
    version: "Revise 01",
    kind,
    mimeType: "",
    updatedAt: new Date().toISOString().slice(0, 10),
    summary: "",
    latest: false,
    checked: false,
    rooms: [],
    viewerUrl: "",
    downloadUrl: "",
  };
}

export function createEmptyGalleryImage(): ClientRoomGalleryImage {
  return {
    id: createClientRoomId("img"),
    src: "",
    caption: "",
  };
}

export function createEmptyGalleryRoom(): ClientRoomGalleryRoom {
  return {
    id: createClientRoomId("room"),
    name: "",
    images: [createEmptyGalleryImage()],
  };
}

export function createEmptyClientRoomDraft(
  input?: Partial<Pick<ClientRoomDraftData, "title" | "clientName" | "slug">>,
): ClientRoomDraftData {
  return {
    slug: input?.slug ?? "",
    title: input?.title ?? "Untitled Client Room",
    clientName: input?.clientName ?? "",
    projectType: "House",
    location: "",
    area: "",
    year: String(new Date().getFullYear()),
    overview: "",
    heroImageUrl: "",
    sections: clientRoomSectionTemplates.map((section) => ({
      ...section,
      items: [],
    })),
    gallery: [],
  };
}
