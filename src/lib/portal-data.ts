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
      "บ้านพักอาศัย 2 ชั้นที่รวม Mood & Tone, Design, Construction Drawing และ BOQ ไว้ในลิงก์เดียว เพื่อให้ลูกค้าเลือกดูเป็นรายหมวดและราย revision ได้ทันที.",
    nextMilestone: "ส่ง Revise 03 ของแบบและ BOQ สำหรับอนุมัติหน้างาน",
    ownerNote: "เมื่อลูกค้า approve รอบนี้ ค่อย export drawing เป็น PDF print ชุดเต็ม",
    sections: [
      {
        id: "mood-tone",
        title: "Mood & Tone",
        description: "ภาพรวมอารมณ์ วัสดุ และทิศทางงานก่อนเข้ารายละเอียดแบบจริง",
        items: [
          {
            id: "mood-tone-v3",
            title: "Warm Earth Interior Direction",
            version: "Revise 03",
            kind: "canva",
            updatedAt: "2026-03-14",
            summary: "เวอร์ชันล่าสุดสำหรับยืนยันโทนไม้ ผิววัสดุ และ lighting language ก่อนปิด concept.",
            latest: true,
          },
          {
            id: "mood-tone-v2",
            title: "Warm Earth Interior Direction",
            version: "Revise 02",
            kind: "canva",
            updatedAt: "2026-03-07",
            summary: "ปรับโทนสีผนังและ texture ของผ้าให้ใกล้กับ reference ที่ลูกค้าเลือก.",
          },
          {
            id: "mood-tone-v1",
            title: "Warm Earth Interior Direction",
            version: "Revise 01",
            kind: "canva",
            updatedAt: "2026-02-28",
            summary: "เวอร์ชันเริ่มต้นสำหรับเทียบ mood หลักและแนววัสดุของบ้าน.",
          },
        ],
      },
      {
        id: "design",
        title: "Design",
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
          {
            id: "design-v1",
            title: "Design Presentation",
            version: "Revise 01",
            kind: "pdf",
            updatedAt: "2026-02-21",
            summary: "เวอร์ชันแรกหลังสรุป zoning และ furniture layout เบื้องต้น.",
          },
        ],
      },
      {
        id: "construction",
        title: "Construction Drawing",
        description: "ไฟล์หน้างานที่ลูกค้าและผู้รับเหมาควรเปิดดูจากเว็บหรือโหลดเป็น PDF ได้",
        items: [
          {
            id: "construction-v3",
            title: "Construction Drawing Set",
            version: "Revise 03",
            kind: "pdf",
            updatedAt: "2026-03-15",
            summary: "ชุด drawing ล่าสุดสำหรับ built-in, electrical จุดหลัก และ section ที่จำเป็น.",
            latest: true,
          },
          {
            id: "construction-v2",
            title: "Construction Drawing Set",
            version: "Revise 02",
            kind: "pdf",
            updatedAt: "2026-03-10",
            summary: "ปรับ detail หน้างานของ built-in และ electrical point ตาม feedback รอบก่อน.",
          },
          {
            id: "construction-v1",
            title: "Construction Drawing Set",
            version: "Revise 01",
            kind: "pdf",
            updatedAt: "2026-03-02",
            summary: "ชุด drawing เริ่มต้นก่อนสรุปรายละเอียดและแก้หน้างาน.",
          },
        ],
      },
      {
        id: "boq",
        title: "BOQ",
        description: "รายการวัสดุและประมาณราคาเพื่อใช้ดู scope และงบประมาณของแต่ละ revision",
        items: [
          {
            id: "boq-v3",
            title: "BOQ Package",
            version: "Revise 03",
            kind: "pdf",
            updatedAt: "2026-03-14",
            summary: "อัปเดตราคาวัสดุ built-in, ผิวไม้ และรายการงานระบบตามแบบล่าสุด.",
            latest: true,
          },
          {
            id: "boq-v2",
            title: "BOQ Package",
            version: "Revise 02",
            kind: "pdf",
            updatedAt: "2026-03-08",
            summary: "เวอร์ชันกลางสำหรับเทียบต้นทุนก่อนสรุปรายการวัสดุจริง.",
          },
          {
            id: "boq-v1",
            title: "BOQ Package",
            version: "Revise 01",
            kind: "pdf",
            updatedAt: "2026-03-01",
            summary: "BOQ ชุดแรกสำหรับประเมินงบเบื้องต้นของโปรเจกต์นี้.",
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
      "โครงการปรับห้องทำงานในบ้านให้พร้อมประชุมออนไลน์ โดยแบ่งเอกสารเป็น Mood & Tone, Design, Construction Drawing และ BOQ เพื่อ review เป็นชั้น ๆ.",
    nextMilestone: "รอ approve moodboard และ final design direction",
    ownerNote: "ลูกค้าเปิดดูจากมือถือบ่อย ต้องเช็กทุก document ว่าอ่านง่ายบนจอเล็ก",
    sections: [
      {
        id: "mood-tone",
        title: "Mood & Tone",
        description: "ตัวเลือกโทนอบอุ่นและโทนสว่างสำหรับพื้นที่ทำงาน",
        items: [
          {
            id: "office-mood-v2",
            title: "Nordic Calm Palette",
            version: "Revise 02",
            kind: "canva",
            updatedAt: "2026-03-08",
            summary: "โทนไม้สว่าง ผนัง warm white และ accent สีเขียวอมเทา.",
            latest: true,
          },
          {
            id: "office-mood-v1",
            title: "Soft Contrast Palette",
            version: "Revise 01",
            kind: "canva",
            updatedAt: "2026-03-05",
            summary: "ทางเลือกที่ contrast มากขึ้นสำหรับ background ใน video call.",
          },
        ],
      },
      {
        id: "design",
        title: "Design",
        description: "ชุด layout และมุมมองหลักก่อนปิดแบบ",
        items: [
          {
            id: "office-design-v2",
            title: "Draft Layout Pack",
            version: "Revise 02",
            kind: "pdf",
            updatedAt: "2026-03-08",
            summary: "รวม layout, shelving idea และการจัดแสงสำหรับ work focus.",
            latest: true,
          },
          {
            id: "office-design-v1",
            title: "Draft Layout Pack",
            version: "Revise 01",
            kind: "pdf",
            updatedAt: "2026-03-06",
            summary: "แบบร่างรอบแรกก่อนปรับขนาด shelving และมุมกล้องสำหรับ video call.",
          },
        ],
      },
      {
        id: "construction",
        title: "Construction Drawing",
        description: "แบบก่อสร้างหลักสำหรับเฟอร์นิเจอร์บิวท์อินและระบบไฟ",
        items: [
          {
            id: "office-construction-v1",
            title: "Home Office Drawing Set",
            version: "Revise 01",
            kind: "pdf",
            updatedAt: "2026-03-08",
            summary: "แบบ built-in, จุดปลั๊ก และ elevation หลักของพื้นที่ทำงาน.",
            latest: true,
          },
        ],
      },
      {
        id: "boq",
        title: "BOQ",
        description: "ประมาณราคาและรายการวัสดุสำหรับสรุปงบก่อนเริ่มผลิต",
        items: [
          {
            id: "office-boq-v1",
            title: "BOQ Package",
            version: "Revise 01",
            kind: "pdf",
            updatedAt: "2026-03-07",
            summary: "BOQ สำหรับ built-in shelf, โต๊ะทำงาน และไฟตกแต่งชุดแรก.",
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
      "รีโนเวตร้านกาแฟขนาดกลางโดยแยกเอกสารเป็น Mood & Tone, Design, Construction Drawing และ BOQ เพื่อให้เจ้าของร้านไล่ดูเป็น revision ได้ง่าย.",
    nextMilestone: "ส่ง revise ชุดล่าสุดก่อนเริ่มงาน built-in counter",
    ownerNote: "ถ้า drawing set ชุดถัดไปเกิน 25MB ให้ย้ายไฟล์ PDF ไป R2 แล้วใช้ path เดิมใน portal",
    sections: [
      {
        id: "mood-tone",
        title: "Mood & Tone",
        description: "โทนวัสดุและบรรยากาศร้านก่อนปิดแบบใช้งานจริง",
        items: [
          {
            id: "cafe-mood-v2",
            title: "Cafe Material Direction",
            version: "Revise 02",
            kind: "canva",
            updatedAt: "2026-03-07",
            summary: "คุมโทนไม้เข้ม ผนังปูน และแสง warm dim เพื่อรองรับภาพลักษณ์ร้าน.",
            latest: true,
          },
          {
            id: "cafe-mood-v1",
            title: "Cafe Material Direction",
            version: "Revise 01",
            kind: "canva",
            updatedAt: "2026-02-26",
            summary: "เวอร์ชันแรกสำหรับเทียบ mood ของ bar counter และ facade.",
          },
        ],
      },
      {
        id: "design",
        title: "Design",
        description: "งานนำเสนอภาพรวมร้าน, zoning และ material update",
        items: [
          {
            id: "cafe-design-v2",
            title: "Cafe Design Update",
            version: "Revise 02",
            kind: "pdf",
            updatedAt: "2026-03-09",
            summary: "เวอร์ชันที่ปิดรายละเอียด facade, bar counter และ seating mix แล้ว.",
            latest: true,
          },
          {
            id: "cafe-design-v1",
            title: "Cafe Design Update",
            version: "Revise 01",
            kind: "pdf",
            updatedAt: "2026-03-01",
            summary: "รอบแรกหลังสรุป zoning ของ counter, service และ guest seating.",
          },
        ],
      },
      {
        id: "construction",
        title: "Construction Drawing",
        description: "drawing หน้างานสำหรับผู้รับเหมาและลูกค้าเปิดดูในเว็บได้ทันที",
        items: [
          {
            id: "cafe-construction-v2",
            title: "Construction Drawing Set",
            version: "Revise 02",
            kind: "pdf",
            updatedAt: "2026-03-15",
            summary: "รวม plan, reflected ceiling plan, counter section และ signage details.",
            latest: true,
          },
          {
            id: "cafe-construction-v1",
            title: "Construction Drawing Set",
            version: "Revise 01",
            kind: "pdf",
            updatedAt: "2026-02-28",
            summary: "เก็บไว้ให้ทีมย้อนเช็ก version เดิมก่อนแก้ issue ใหม่.",
          },
        ],
      },
      {
        id: "boq",
        title: "BOQ",
        description: "รายการวัสดุและประมาณราคาเพื่อใช้อนุมัติงบและ scope งานร้าน",
        items: [
          {
            id: "cafe-boq-v2",
            title: "BOQ Package",
            version: "Revise 02",
            kind: "pdf",
            updatedAt: "2026-03-12",
            summary: "เวอร์ชันล่าสุดของงบ built-in counter, loose furniture และงาน signage.",
            latest: true,
          },
          {
            id: "cafe-boq-v1",
            title: "BOQ Package",
            version: "Revise 01",
            kind: "pdf",
            updatedAt: "2026-03-03",
            summary: "BOQ รอบแรกสำหรับเทียบต้นทุนก่อนตัดสินใจเลือกวัสดุ final.",
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
  return project.sections
    .flatMap((section) => section.items)
    .find((item) => item.id === documentId);
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
