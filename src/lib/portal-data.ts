export type DocumentKind = "canva" | "pdf";
export type ProjectStage = "concept" | "revision" | "construction" | "archived";

export interface ProjectDocument {
  id: string;
  title: string;
  version: string;
  kind: DocumentKind;
  updatedAt: string;
  summary: string;
  latest?: boolean;
  viewerUrl?: string;
  downloadUrl?: string;
}

export interface ProjectSection {
  id: string;
  title: string;
  description: string;
  items: ProjectDocument[];
}

export interface ClientProject {
  slug: string;
  code: string;
  title: string;
  clientName: string;
  projectType: string;
  location: string;
  stage: ProjectStage;
  updatedAt: string;
  retentionUntil: string;
  shareMode: string;
  viewerCount: number;
  overview: string;
  nextMilestone: string;
  ownerNote: string;
  sections: ProjectSection[];
}

const projects: ClientProject[] = [
  {
    slug: "riverside-residence-b7x2",
    code: "B7X2",
    title: "Riverside Residence",
    clientName: "Khun Narin",
    projectType: "Private Residence",
    location: "Bangkok",
    stage: "revision",
    updatedAt: "2026-03-14",
    retentionUntil: "2029-03-14",
    shareMode: "Cloudflare Access by email",
    viewerCount: 2,
    overview:
      "บ้านพักอาศัย 2 ชั้นที่ต้องรวม moodboard, design update, revision archive, drawing set และ timeline ไว้ในลิงก์เดียวสำหรับลูกค้า.",
    nextMilestone: "ส่ง Revise 03 และ drawing set สำหรับอนุมัติหน้างาน",
    ownerNote: "เมื่อลูกค้า approve รอบนี้ ค่อย export drawing เป็น PDF print ชุดเต็ม",
    sections: [
      {
        id: "mood-tone",
        title: "Mood & Tone",
        description: "ภาพรวมอารมณ์ วัสดุ และทิศทางงานก่อนเข้ารายละเอียดแบบจริง",
        items: [
          {
            id: "mood-tone-v2",
            title: "Warm Earth Interior Direction",
            version: "Latest concept",
            kind: "canva",
            updatedAt: "2026-03-12",
            summary: "ใช้สำหรับยืนยันโทนสีหลัก วัสดุไม้ และ lighting language ก่อนปิด concept.",
            latest: true,
          },
        ],
      },
      {
        id: "design",
        title: "Design Proposal",
        description: "ไฟล์นำเสนอ layout, material direction และภาพรวมของแต่ละ space",
        items: [
          {
            id: "design-v3",
            title: "Design Presentation",
            version: "Revise 03",
            kind: "pdf",
            updatedAt: "2026-03-14",
            summary: "เวอร์ชันล่าสุดที่รวม feedback รอบล่าสุดของห้องรับแขกและ master bedroom.",
            latest: true,
          },
          {
            id: "design-v2",
            title: "Design Presentation",
            version: "Revise 02",
            kind: "pdf",
            updatedAt: "2026-03-03",
            summary: "เก็บไว้เป็น archive สำหรับย้อนกลับไปเทียบ before/after ของ feedback.",
          },
        ],
      },
      {
        id: "revisions",
        title: "Revision Archive",
        description: "เก็บเวอร์ชันเก่าย้อนหลังเพื่อให้ลูกค้าดูเฉพาะที่เกี่ยวข้องกับงานของตัวเอง",
        items: [
          {
            id: "revise-01",
            title: "Revision Package",
            version: "Revise 01",
            kind: "pdf",
            updatedAt: "2026-02-21",
            summary: "รวม feedback ชุดแรกจาก zoning และ furniture layout.",
          },
          {
            id: "revise-02",
            title: "Revision Package",
            version: "Revise 02",
            kind: "pdf",
            updatedAt: "2026-03-03",
            summary: "ปรับวัสดุ built-in และ ceiling detail ตามข้อเสนอแนะของลูกค้า.",
          },
        ],
      },
      {
        id: "construction",
        title: "Construction Drawing",
        description: "ไฟล์หน้างานที่ลูกค้าและผู้รับเหมาควรเปิดดูจากเว็บหรือโหลดเป็น PDF ได้",
        items: [
          {
            id: "cd-set-a",
            title: "Construction Drawing Set",
            version: "Issue A",
            kind: "pdf",
            updatedAt: "2026-03-15",
            summary: "ชุด drawing ล่าสุดสำหรับ built-in, electrical จุดหลัก และ section ที่จำเป็น.",
            latest: true,
          },
        ],
      },
      {
        id: "timeline",
        title: "Timeline",
        description: "ลำดับงานก่อสร้างและรายการที่ต้อง approve เพื่อไม่ให้ schedule หลุด",
        items: [
          {
            id: "timeline-master",
            title: "Construction Timeline",
            version: "Master timeline",
            kind: "pdf",
            updatedAt: "2026-03-10",
            summary: "ใช้คุย milestone การสั่งของ, built-in production และ site handover.",
            latest: true,
          },
        ],
      },
    ],
  },
  {
    slug: "nordic-home-office-l2k7",
    code: "L2K7",
    title: "Nordic Home Office",
    clientName: "Khun Ploy",
    projectType: "Home Office",
    location: "Chiang Mai",
    stage: "concept",
    updatedAt: "2026-03-08",
    retentionUntil: "2029-03-08",
    shareMode: "Cloudflare Access by one-time PIN",
    viewerCount: 1,
    overview:
      "โครงการปรับห้องทำงานในบ้านให้พร้อมประชุมออนไลน์ ใช้ลิงก์เดียวรวม concept, design draft และ timeline เพื่อ review เร็ว.",
    nextMilestone: "รอ approve moodboard และ final design direction",
    ownerNote: "ลูกค้าเปิดดูจากมือถือบ่อย ต้องเช็กทุก document ว่าอ่านง่ายบนจอเล็ก",
    sections: [
      {
        id: "mood-tone",
        title: "Mood & Tone",
        description: "ตัวเลือกโทนอบอุ่นและโทนสว่างสำหรับพื้นที่ทำงาน",
        items: [
          {
            id: "mood-tone-v1",
            title: "Nordic Calm Palette",
            version: "Concept 01",
            kind: "canva",
            updatedAt: "2026-03-05",
            summary: "โทนไม้สว่าง ผนัง warm white และ accent สีเขียวอมเทา.",
            latest: true,
          },
          {
            id: "mood-tone-v2",
            title: "Soft Contrast Palette",
            version: "Concept 02",
            kind: "canva",
            updatedAt: "2026-03-08",
            summary: "ทางเลือกที่ contrast มากขึ้นสำหรับ background ใน video call.",
          },
        ],
      },
      {
        id: "design",
        title: "Design Draft",
        description: "ชุด layout และมุมมองหลักก่อนปิดแบบ",
        items: [
          {
            id: "design-draft-v1",
            title: "Draft Layout Pack",
            version: "Draft 01",
            kind: "pdf",
            updatedAt: "2026-03-08",
            summary: "รวม layout, shelving idea และการจัดแสงสำหรับ work focus.",
            latest: true,
          },
        ],
      },
      {
        id: "timeline",
        title: "Timeline",
        description: "ช่วงเวลา design freeze, production และ install",
        items: [
          {
            id: "timeline-light",
            title: "Mini Timeline",
            version: "Planning",
            kind: "pdf",
            updatedAt: "2026-03-06",
            summary: "ใช้กำหนดวันปิดแบบและวันเริ่มติดตั้งเฟอร์นิเจอร์บิวท์อิน.",
            latest: true,
          },
        ],
      },
    ],
  },
  {
    slug: "atelier-cafe-renovation-m4p1",
    code: "M4P1",
    title: "Atelier Cafe Renovation",
    clientName: "Atelier Brew",
    projectType: "Cafe Renovation",
    location: "Nonthaburi",
    stage: "construction",
    updatedAt: "2026-03-15",
    retentionUntil: "2029-03-15",
    shareMode: "Cloudflare Access by email",
    viewerCount: 3,
    overview:
      "รีโนเวตร้านกาแฟขนาดกลางโดยใช้ portal สำหรับแชร์ drawing หน้างาน, design update และ schedule ให้เจ้าของร้านดูได้จากลิงก์เดียว.",
    nextMilestone: "ส่ง issue B ก่อนเริ่มงาน built-in counter",
    ownerNote: "ถ้า drawing set ชุดถัดไปเกิน 25MB ให้ย้ายไฟล์ PDF ไป R2 แล้วใช้ path เดิมใน portal",
    sections: [
      {
        id: "design",
        title: "Design",
        description: "งานนำเสนอภาพรวมร้าน, zoning และ material update",
        items: [
          {
            id: "design-v4",
            title: "Cafe Design Update",
            version: "Revise 04",
            kind: "pdf",
            updatedAt: "2026-03-09",
            summary: "เวอร์ชันที่ปิดรายละเอียด facade, bar counter และ seating mix แล้ว.",
            latest: true,
          },
        ],
      },
      {
        id: "construction",
        title: "Construction Drawing",
        description: "drawing หน้างานสำหรับผู้รับเหมาและลูกค้าเปิดดูในเว็บได้ทันที",
        items: [
          {
            id: "cd-set-b",
            title: "Construction Drawing Set",
            version: "Issue B",
            kind: "pdf",
            updatedAt: "2026-03-15",
            summary: "รวม plan, reflected ceiling plan, counter section และ signage details.",
            latest: true,
          },
          {
            id: "cd-set-a",
            title: "Construction Drawing Set",
            version: "Issue A",
            kind: "pdf",
            updatedAt: "2026-02-28",
            summary: "เก็บไว้ให้ทีมย้อนเช็ก version เดิมก่อนแก้ issue ใหม่.",
          },
        ],
      },
      {
        id: "timeline",
        title: "Timeline",
        description: "แผนงาน renovation, procurement และ site handover",
        items: [
          {
            id: "timeline-site",
            title: "Site Timeline",
            version: "Execution",
            kind: "pdf",
            updatedAt: "2026-03-11",
            summary: "ใช้ track งานรื้อ, built-in production, install และ soft opening.",
            latest: true,
          },
        ],
      },
    ],
  },
];

export function getProjects() {
  return projects;
}

export function getProjectBySlug(slug: string) {
  return projects.find((project) => project.slug === slug);
}

export function getProjectDocument(project: ClientProject, documentId: string) {
  return project.sections.flatMap((section) => section.items).find((item) => item.id === documentId);
}

export function getProjectDocumentCount(project: ClientProject) {
  return project.sections.reduce((count, section) => count + section.items.length, 0);
}

export function getLatestDocuments(project: ClientProject) {
  const marked = project.sections
    .flatMap((section) => section.items.map((item) => ({ ...item, sectionTitle: section.title })))
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
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
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
