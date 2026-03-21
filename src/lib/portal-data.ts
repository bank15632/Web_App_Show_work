export type DocumentKind = "canva" | "pdf";
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
  updatedAt: string;
  summary: string;
  latest?: boolean;
  checked?: boolean;
  rooms?: RevisionRoom[];
  viewerUrl?: string;
  downloadUrl?: string;
}

export interface ProjectSection {
  id: string;
  title: string;
  description: string;
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

const projects: ClientProject[] = [
  {
    slug: "riverside-residence-b7x2",
    code: "B7X2",
    title: "Riverside Residence",
    clientName: "Khun Narin",
    projectType: "House",
    location: "Bangkok",
    stage: "revision",
    revisionStatus: "doing",
    createdAt: "2026-01-10",
    updatedAt: "2026-03-14",
    retentionUntil: "2029-03-14",
    shareMode: "Cloudflare Access by email",
    viewerCount: 2,
    overview:
      "บ้านพักอาศัย 2 ชั้นที่รวม Mood & Tone, Design, Construction Drawing และ BOQ ไว้ในลิงก์เดียว เพื่อให้ลูกค้าเลือกดูเป็นรายหมวดและราย revision ได้ทันที.",
    nextMilestone: "ส่ง Revise 03 ของแบบและ BOQ สำหรับอนุมัติหน้างาน",
    ownerNote: "เมื่อลูกค้า approve รอบนี้ ค่อย export drawing เป็น PDF print ชุดเต็ม",
    area: "320 ตร.ม.",
    year: "2026",
    gallery: [
      { id: "r1", name: "ห้องนั่งเล่น", images: [
        { id: "g-1", src: "/gallery/riverside/living-01.jpg", caption: "Warm Earth Tone - มุมโซฟา" },
        { id: "g-2", src: "/gallery/riverside/living-02.jpg", caption: "Warm Earth Tone - มุมทีวี" },
      ]},
      { id: "r2", name: "ห้องนอนใหญ่", images: [
        { id: "g-3", src: "/gallery/riverside/master-01.jpg", caption: "Natural Light - เตียง" },
        { id: "g-4", src: "/gallery/riverside/master-02.jpg", caption: "Natural Light - walk-in closet" },
      ]},
      { id: "r3", name: "ห้องครัว", images: [
        { id: "g-5", src: "/gallery/riverside/kitchen-01.jpg", caption: "Oak & Stone - เคาน์เตอร์" },
      ]},
      { id: "r4", name: "ห้องน้ำ", images: [
        { id: "g-6", src: "/gallery/riverside/bath-01.jpg", caption: "Minimal Spa" },
      ]},
    ],
    sections: [
      {
        id: "mood-tone",
        title: "Mood & Tone",
        description: "ภาพรวมอารมณ์ วัสดุ และทิศทางงานก่อนเข้ารายละเอียดแบบจริง",
        items: [
          {
            id: "mood-tone-v3",
            checked: false,
            rooms: [{ name: "ห้องนั่งเล่น", description: "ปรับโทนผนังและ accent" }, { name: "ห้องนอนใหญ่", description: "เพิ่ม warm lighting" }, { name: "ห้องครัว", description: "อัปเดตวัสดุ countertop" }],
            title: "Warm Earth Interior Direction",
            version: "Revise 03",
            kind: "canva",
            updatedAt: "2026-03-14",
            summary: "เวอร์ชันล่าสุดสำหรับยืนยันโทนไม้ ผิววัสดุ และ lighting language ก่อนปิด concept.",
            latest: true,
          },
          {
            id: "mood-tone-v2",
            checked: true,
            rooms: [{ name: "ห้องนั่งเล่น", description: "ปรับ texture ผ้า" }, { name: "ห้องนอนใหญ่", description: "เปลี่ยนโทนผนัง" }],
            title: "Warm Earth Interior Direction",
            version: "Revise 02",
            kind: "canva",
            updatedAt: "2026-03-07",
            summary: "ปรับโทนสีผนังและ texture ของผ้าให้ใกล้กับ reference ที่ลูกค้าเลือก.",
          },
          {
            id: "mood-tone-v1",
            checked: true,
            rooms: [{ name: "ทั้งหลัง", description: "Mood เริ่มต้น" }],
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
            checked: false,
            rooms: [{ name: "ห้องนั่งเล่น", description: "ปรับ layout โซฟา" }, { name: "ห้องนอนใหญ่", description: "แก้ walk-in closet" }],
            title: "Design Presentation",
            version: "Revise 03",
            kind: "pdf",
            updatedAt: "2026-03-14",
            summary: "เวอร์ชันล่าสุดที่รวม feedback รอบล่าสุดของห้องรับแขกและ master bedroom.",
            latest: true,
          },
          {
            id: "design-v2",
            checked: true,
            rooms: [{ name: "ห้องนั่งเล่น", description: "ย้ายตำแหน่งทีวี" }, { name: "ห้องครัว", description: "เปลี่ยน island layout" }],
            title: "Design Presentation",
            version: "Revise 02",
            kind: "pdf",
            updatedAt: "2026-03-03",
            summary: "เก็บไว้เป็น archive สำหรับย้อนกลับไปเทียบ before/after ของ feedback.",
          },
          {
            id: "design-v1",
            checked: true,
            rooms: [{ name: "ทั้งหลัง", description: "Zoning และ layout เบื้องต้น" }],
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
            checked: false,
            rooms: [{ name: "ห้องนั่งเล่น", description: "built-in ตู้ทีวี" }, { name: "ห้องนอนใหญ่", description: "electrical + built-in" }, { name: "ห้องครัว", description: "cabinet detail" }],
            title: "Construction Drawing Set",
            version: "Revise 03",
            kind: "pdf",
            updatedAt: "2026-03-15",
            summary: "ชุด drawing ล่าสุดสำหรับ built-in, electrical จุดหลัก และ section ที่จำเป็น.",
            latest: true,
          },
          {
            id: "construction-v2",
            checked: true,
            rooms: [{ name: "ห้องนั่งเล่น", description: "ปรับ electrical point" }, { name: "ห้องนอนใหญ่", description: "แก้ built-in detail" }],
            title: "Construction Drawing Set",
            version: "Revise 02",
            kind: "pdf",
            updatedAt: "2026-03-10",
            summary: "ปรับ detail หน้างานของ built-in และ electrical point ตาม feedback รอบก่อน.",
          },
          {
            id: "construction-v1",
            checked: true,
            rooms: [{ name: "ทั้งหลัง", description: "Drawing set เริ่มต้น" }],
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
            checked: false,
            rooms: [{ name: "ห้องนั่งเล่น", description: "อัปเดตราคา built-in" }, { name: "ห้องนอนใหญ่", description: "เพิ่มรายการ closet" }, { name: "ห้องครัว", description: "ราคาวัสดุ countertop" }],
            title: "BOQ Package",
            version: "Revise 03",
            kind: "pdf",
            updatedAt: "2026-03-14",
            summary: "อัปเดตราคาวัสดุ built-in, ผิวไม้ และรายการงานระบบตามแบบล่าสุด.",
            latest: true,
          },
          {
            id: "boq-v2",
            checked: true,
            rooms: [{ name: "ทั้งหลัง", description: "เทียบต้นทุนวัสดุ" }],
            title: "BOQ Package",
            version: "Revise 02",
            kind: "pdf",
            updatedAt: "2026-03-08",
            summary: "เวอร์ชันกลางสำหรับเทียบต้นทุนก่อนสรุปรายการวัสดุจริง.",
          },
          {
            id: "boq-v1",
            checked: true,
            rooms: [{ name: "ทั้งหลัง", description: "BOQ เบื้องต้น" }],
            title: "BOQ Package",
            version: "Revise 01",
            kind: "pdf",
            updatedAt: "2026-03-01",
            summary: "BOQ ชุดแรกสำหรับประเมินงบเบื้องต้นของโปรเจกต์นี้.",
          },
        ],
      },
      {
        id: "timeline",
        title: "Timeline",
        description: "แผนงานก่อสร้างจาก Microsoft Project",
        items: [
          {
            id: "timeline-v2",
            checked: false,
            rooms: [{ name: "ทั้งหลัง", description: "อัปเดต progress" }],
            title: "Construction Timeline",
            version: "Revise 02",
            kind: "pdf",
            updatedAt: "2026-03-14",
            summary: "แผนงานล่าสุดอัปเดตตาม progress หน้างานจริง.",
            latest: true,
          },
          {
            id: "timeline-v1",
            checked: true,
            rooms: [{ name: "ทั้งหลัง", description: "แผนงานเบื้องต้น" }],
            title: "Construction Timeline",
            version: "Revise 01",
            kind: "pdf",
            updatedAt: "2026-02-20",
            summary: "แผนงานเบื้องต้นก่อนเริ่มงานก่อสร้าง.",
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
    projectType: "House",
    location: "Chiang Mai",
    stage: "concept",
    revisionStatus: "todo",
    createdAt: "2026-02-10",
    updatedAt: "2026-03-08",
    retentionUntil: "2029-03-08",
    shareMode: "Cloudflare Access by one-time PIN",
    viewerCount: 1,
    overview:
      "โครงการปรับห้องทำงานในบ้านให้พร้อมประชุมออนไลน์ โดยแบ่งเอกสารเป็น Mood & Tone, Design, Construction Drawing และ BOQ เพื่อ review เป็นชั้น ๆ.",
    nextMilestone: "รอ approve moodboard และ final design direction",
    ownerNote: "ลูกค้าเปิดดูจากมือถือบ่อย ต้องเช็กทุก document ว่าอ่านง่ายบนจอเล็ก",
    area: "25 ตร.ม.",
    year: "2026",
    gallery: [
      { id: "r1", name: "ห้องทำงาน", images: [
        { id: "g-1", src: "/gallery/nordic-office/desk-01.jpg", caption: "Work Desk - Nordic Calm" },
        { id: "g-2", src: "/gallery/nordic-office/shelf-01.jpg", caption: "Shelving - Light Oak" },
      ]},
    ],
    sections: [
      {
        id: "mood-tone",
        title: "Mood & Tone",
        description: "ตัวเลือกโทนอบอุ่นและโทนสว่างสำหรับพื้นที่ทำงาน",
        items: [
          {
            id: "office-mood-v2",
            checked: false,
            rooms: [{ name: "ห้องทำงาน", description: "ปรับโทนไม้และ accent" }],
            title: "Nordic Calm Palette",
            version: "Revise 02",
            kind: "canva",
            updatedAt: "2026-03-08",
            summary: "โทนไม้สว่าง ผนัง warm white และ accent สีเขียวอมเทา.",
            latest: true,
          },
          {
            id: "office-mood-v1",
            checked: true,
            rooms: [{ name: "ห้องทำงาน", description: "Mood เริ่มต้น" }],
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
            checked: false,
            rooms: [{ name: "ห้องทำงาน", description: "ปรับ shelving และแสง" }],
            title: "Draft Layout Pack",
            version: "Revise 02",
            kind: "pdf",
            updatedAt: "2026-03-08",
            summary: "รวม layout, shelving idea และการจัดแสงสำหรับ work focus.",
            latest: true,
          },
          {
            id: "office-design-v1",
            checked: true,
            rooms: [{ name: "ห้องทำงาน", description: "Layout เบื้องต้น" }],
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
            checked: false,
            rooms: [{ name: "ห้องทำงาน", description: "Built-in และจุดปลั๊ก" }],
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
            checked: false,
            rooms: [{ name: "ห้องทำงาน", description: "BOQ built-in + ไฟ" }],
            title: "BOQ Package",
            version: "Revise 01",
            kind: "pdf",
            updatedAt: "2026-03-07",
            summary: "BOQ สำหรับ built-in shelf, โต๊ะทำงาน และไฟตกแต่งชุดแรก.",
            latest: true,
          },
        ],
      },
      {
        id: "timeline",
        title: "Timeline",
        description: "แผนงานปรับปรุงห้องทำงาน",
        items: [
          {
            id: "office-timeline-v1",
            checked: false,
            rooms: [{ name: "ทั้งหลัง", description: "แผนงานเบื้องต้น" }],
            title: "Renovation Timeline",
            version: "Revise 01",
            kind: "pdf",
            updatedAt: "2026-03-08",
            summary: "แผนงานเบื้องต้นสำหรับงาน built-in และระบบไฟ.",
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
    projectType: "Commercial",
    location: "Nonthaburi",
    stage: "construction",
    revisionStatus: "done",
    createdAt: "2025-11-20",
    updatedAt: "2026-03-15",
    retentionUntil: "2029-03-15",
    shareMode: "Cloudflare Access by email",
    viewerCount: 3,
    overview:
      "รีโนเวตร้านกาแฟขนาดกลางโดยแยกเอกสารเป็น Mood & Tone, Design, Construction Drawing และ BOQ เพื่อให้เจ้าของร้านไล่ดูเป็น revision ได้ง่าย.",
    nextMilestone: "ส่ง revise ชุดล่าสุดก่อนเริ่มงาน built-in counter",
    ownerNote: "ถ้า drawing set ชุดถัดไปเกิน 25MB ให้ย้ายไฟล์ PDF ไป R2 แล้วใช้ path เดิมใน portal",
    area: "180 ตร.ม.",
    year: "2025",
    gallery: [
      { id: "r1", name: "หน้าร้าน", images: [
        { id: "g-1", src: "/gallery/atelier-cafe/facade-01.jpg", caption: "Facade - Dark Wood & Concrete" },
      ]},
      { id: "r2", name: "เคาน์เตอร์", images: [
        { id: "g-2", src: "/gallery/atelier-cafe/counter-01.jpg", caption: "Bar Counter - Custom Built-in" },
      ]},
      { id: "r3", name: "ที่นั่ง", images: [
        { id: "g-3", src: "/gallery/atelier-cafe/seating-01.jpg", caption: "Seating Area - Warm Dim Light" },
      ]},
    ],
    sections: [
      {
        id: "mood-tone",
        title: "Mood & Tone",
        description: "โทนวัสดุและบรรยากาศร้านก่อนปิดแบบใช้งานจริง",
        items: [
          {
            id: "cafe-mood-v2",
            checked: true,
            rooms: [{ name: "หน้าร้าน", description: "โทน facade" }, { name: "เคาน์เตอร์", description: "วัสดุ bar" }],
            title: "Cafe Material Direction",
            version: "Revise 02",
            kind: "canva",
            updatedAt: "2026-03-07",
            summary: "คุมโทนไม้เข้ม ผนังปูน และแสง warm dim เพื่อรองรับภาพลักษณ์ร้าน.",
            latest: true,
          },
          {
            id: "cafe-mood-v1",
            checked: true,
            rooms: [{ name: "ทั้งร้าน", description: "Mood เริ่มต้น" }],
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
            checked: true,
            rooms: [{ name: "หน้าร้าน", description: "Facade detail" }, { name: "เคาน์เตอร์", description: "Bar counter layout" }, { name: "ที่นั่ง", description: "Seating mix" }],
            title: "Cafe Design Update",
            version: "Revise 02",
            kind: "pdf",
            updatedAt: "2026-03-09",
            summary: "เวอร์ชันที่ปิดรายละเอียด facade, bar counter และ seating mix แล้ว.",
            latest: true,
          },
          {
            id: "cafe-design-v1",
            checked: true,
            rooms: [{ name: "ทั้งร้าน", description: "Zoning เบื้องต้น" }],
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
            checked: true,
            rooms: [{ name: "หน้าร้าน", description: "Plan + signage" }, { name: "เคาน์เตอร์", description: "Counter section" }, { name: "ที่นั่ง", description: "Ceiling plan" }],
            title: "Construction Drawing Set",
            version: "Revise 02",
            kind: "pdf",
            updatedAt: "2026-03-15",
            summary: "รวม plan, reflected ceiling plan, counter section และ signage details.",
            latest: true,
          },
          {
            id: "cafe-construction-v1",
            checked: true,
            rooms: [{ name: "ทั้งร้าน", description: "Drawing เริ่มต้น" }],
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
            checked: true,
            rooms: [{ name: "เคาน์เตอร์", description: "งบ built-in counter" }, { name: "ที่นั่ง", description: "Loose furniture" }, { name: "หน้าร้าน", description: "Signage" }],
            title: "BOQ Package",
            version: "Revise 02",
            kind: "pdf",
            updatedAt: "2026-03-12",
            summary: "เวอร์ชันล่าสุดของงบ built-in counter, loose furniture และงาน signage.",
            latest: true,
          },
          {
            id: "cafe-boq-v1",
            checked: true,
            rooms: [{ name: "ทั้งร้าน", description: "BOQ เบื้องต้น" }],
            title: "BOQ Package",
            version: "Revise 01",
            kind: "pdf",
            updatedAt: "2026-03-03",
            summary: "BOQ รอบแรกสำหรับเทียบต้นทุนก่อนตัดสินใจเลือกวัสดุ final.",
          },
        ],
      },
      {
        id: "timeline",
        title: "Timeline",
        description: "แผนงานก่อสร้างร้านกาแฟ",
        items: [
          {
            id: "cafe-timeline-v2",
            checked: true,
            rooms: [{ name: "ทั้งร้าน", description: "อัปเดต phase งาน" }],
            title: "Construction Timeline",
            version: "Revise 02",
            kind: "pdf",
            updatedAt: "2026-03-15",
            summary: "แผนงานอัปเดตรวม phase งาน counter และ facade.",
            latest: true,
          },
          {
            id: "cafe-timeline-v1",
            checked: true,
            rooms: [{ name: "ทั้งร้าน", description: "แผนงานเริ่มต้น" }],
            title: "Construction Timeline",
            version: "Revise 01",
            kind: "pdf",
            updatedAt: "2026-02-28",
            summary: "แผนงานเริ่มต้นก่อนเริ่มรื้อถอนและก่อสร้าง.",
          },
        ],
      },
    ],
  },
  {
    slug: "sukhumvit-condo-k9r3",
    code: "K9R3",
    title: "Sukhumvit Condo Unit",
    clientName: "Khun Beam",
    projectType: "Condo",
    location: "Bangkok",
    stage: "revision",
    revisionStatus: "doing",
    createdAt: "2026-01-25",
    updatedAt: "2026-03-10",
    retentionUntil: "2029-03-10",
    shareMode: "Cloudflare Access by email",
    viewerCount: 2,
    overview:
      "ตกแต่งคอนโด 2 ห้องนอนสไตล์ Modern Minimal โดยเน้นใช้พื้นที่อย่างคุ้มค่าและวัสดุโทนอบอุ่น.",
    nextMilestone: "รอ approve Design Revise 02 ก่อนเข้าสู่ขั้น construction",
    ownerNote: "ลูกค้าต้องการเน้น built-in storage และ lighting ที่ปรับ mood ได้",
    area: "65 ตร.ม.",
    year: "2026",
    gallery: [
      { id: "r1", name: "ห้องนั่งเล่น", images: [
        { id: "g-1", src: "/gallery/sukhumvit-condo/living-01.jpg", caption: "Living Room - Modern Minimal" },
      ]},
      { id: "r2", name: "ห้องนอนใหญ่", images: [
        { id: "g-2", src: "/gallery/sukhumvit-condo/master-01.jpg", caption: "Master Bedroom - Built-in Wardrobe" },
      ]},
      { id: "r3", name: "ห้องครัว", images: [
        { id: "g-3", src: "/gallery/sukhumvit-condo/kitchen-01.jpg", caption: "Kitchen - Compact Design" },
      ]},
    ],
    sections: [
      {
        id: "mood-tone",
        title: "Mood & Tone",
        description: "โทนสีและวัสดุสำหรับคอนโดสไตล์ Modern Minimal",
        items: [
          {
            id: "condo-suk-mood-v2",
            checked: false,
            rooms: [{ name: "ห้องนั่งเล่น", description: "Clean line accent" }, { name: "ห้องนอนใหญ่", description: "โทนผนัง" }],
            title: "Modern Minimal Direction",
            version: "Revise 02",
            kind: "canva",
            updatedAt: "2026-03-05",
            summary: "โทนไม้อ่อน ผนังขาว accent สีเทาเข้ม เน้น clean line.",
            latest: true,
          },
          {
            id: "condo-suk-mood-v1",
            checked: true,
            rooms: [{ name: "ทั้งห้อง", description: "เปรียบเทียบ 2 แนวทาง" }],
            title: "Modern Minimal Direction",
            version: "Revise 01",
            kind: "canva",
            updatedAt: "2026-02-15",
            summary: "เวอร์ชันแรกเปรียบเทียบ 2 แนวทาง: warm minimal vs cool minimal.",
          },
        ],
      },
      {
        id: "design",
        title: "Design",
        description: "Layout และ furniture plan สำหรับคอนโด 2 ห้องนอน",
        items: [
          {
            id: "condo-suk-design-v2",
            checked: false,
            rooms: [{ name: "ห้องนอนใหญ่", description: "อัปเดต layout" }, { name: "ห้องนอนใหญ่", description: "Walk-in closet" }],
            title: "Condo Layout Presentation",
            version: "Revise 02",
            kind: "pdf",
            updatedAt: "2026-03-10",
            summary: "อัปเดต layout ห้องนอนใหญ่และ walk-in closet ตาม feedback.",
            latest: true,
          },
          {
            id: "condo-suk-design-v1",
            checked: true,
            rooms: [{ name: "ทั้งห้อง", description: "Layout เบื้องต้น" }],
            title: "Condo Layout Presentation",
            version: "Revise 01",
            kind: "pdf",
            updatedAt: "2026-02-20",
            summary: "แบบร่างรอบแรกรวม living, bedroom และ kitchen layout.",
          },
        ],
      },
      {
        id: "construction",
        title: "Construction Drawing",
        description: "แบบก่อสร้างสำหรับงาน built-in และระบบไฟ",
        items: [
          {
            id: "condo-suk-construction-v1",
            checked: false,
            rooms: [{ name: "ห้องนอนใหญ่", description: "Wardrobe built-in" }, { name: "ห้องครัว", description: "Kitchen cabinet" }],
            title: "Condo Drawing Set",
            version: "Revise 01",
            kind: "pdf",
            updatedAt: "2026-03-08",
            summary: "แบบ built-in wardrobe, kitchen cabinet และจุดไฟหลัก.",
            latest: true,
          },
        ],
      },
      {
        id: "boq",
        title: "BOQ",
        description: "รายการวัสดุและประมาณราคาสำหรับคอนโด",
        items: [
          {
            id: "condo-suk-boq-v1",
            checked: false,
            rooms: [{ name: "ทั้งห้อง", description: "BOQ built-in + furniture" }],
            title: "BOQ Package",
            version: "Revise 01",
            kind: "pdf",
            updatedAt: "2026-03-06",
            summary: "BOQ ชุดแรกรวม built-in, loose furniture และงาน M&E.",
            latest: true,
          },
        ],
      },
      {
        id: "timeline",
        title: "Timeline",
        description: "แผนงานตกแต่งคอนโด",
        items: [
          {
            id: "condo-suk-timeline-v1",
            checked: false,
            rooms: [{ name: "ทั้งห้อง", description: "แผนงานเบื้องต้น" }],
            title: "Renovation Timeline",
            version: "Revise 01",
            kind: "pdf",
            updatedAt: "2026-03-10",
            summary: "แผนงานเบื้องต้นสำหรับงาน built-in และ electrical.",
            latest: true,
          },
        ],
      },
    ],
  },
  {
    slug: "ratchada-condo-t5w8",
    code: "T5W8",
    title: "Ratchada Condo Loft",
    clientName: "Khun Mint",
    projectType: "Condo",
    location: "Bangkok",
    stage: "concept",
    revisionStatus: "todo",
    createdAt: "2026-03-01",
    updatedAt: "2026-03-12",
    retentionUntil: "2029-03-12",
    shareMode: "Cloudflare Access by one-time PIN",
    viewerCount: 1,
    overview:
      "คอนโด loft style ชั้นบนเป็นห้องนอน ชั้นล่างเป็น living + work area ต้องการ mood industrial warm.",
    nextMilestone: "รอ approve Mood & Tone ก่อนเริ่มทำ design",
    ownerNote: "ลูกค้าชอบสไตล์ industrial แต่ต้องไม่ดิบเกินไป ให้มี warmth เข้ามา",
    area: "45 ตร.ม.",
    year: "2026",
    gallery: [],
    sections: [
      {
        id: "mood-tone",
        title: "Mood & Tone",
        description: "Industrial warm สำหรับ loft condo",
        items: [
          {
            id: "condo-rat-mood-v1",
            checked: false,
            rooms: [{ name: "ชั้นบน", description: "โทนห้องนอน" }, { name: "ชั้นล่าง", description: "โทน living + work" }],
            title: "Industrial Warm Direction",
            version: "Revise 01",
            kind: "canva",
            updatedAt: "2026-03-12",
            summary: "เปรียบเทียบโทนปูนเปลือย + ไม้สัก vs เหล็กดำ + ไม้โอ๊ค.",
            latest: true,
          },
        ],
      },
      {
        id: "design",
        title: "Design",
        description: "Layout สำหรับ loft 2 ชั้น",
        items: [
          {
            id: "condo-rat-design-v1",
            checked: false,
            rooms: [{ name: "ชั้นบน", description: "Layout ห้องนอน" }, { name: "ชั้นล่าง", description: "Zoning + stair" }],
            title: "Loft Design Draft",
            version: "Revise 01",
            kind: "pdf",
            updatedAt: "2026-03-12",
            summary: "แบบร่าง zoning ชั้นบน-ล่าง รวม stair detail เบื้องต้น.",
            latest: true,
          },
        ],
      },
      {
        id: "construction",
        title: "Construction Drawing",
        description: "แบบก่อสร้างสำหรับ built-in และบันได",
        items: [
          {
            id: "condo-rat-construction-v1",
            checked: false,
            rooms: [{ name: "บันได", description: "Stair + railing" }, { name: "ชั้นล่าง", description: "Built-in เบื้องต้น" }],
            title: "Loft Drawing Set",
            version: "Revise 01",
            kind: "pdf",
            updatedAt: "2026-03-12",
            summary: "แบบบันได, railing และ built-in เบื้องต้น.",
            latest: true,
          },
        ],
      },
      {
        id: "boq",
        title: "BOQ",
        description: "ประมาณราคาสำหรับงาน loft condo",
        items: [
          {
            id: "condo-rat-boq-v1",
            checked: false,
            rooms: [{ name: "ทั้งห้อง", description: "BOQ เบื้องต้น" }],
            title: "BOQ Package",
            version: "Revise 01",
            kind: "pdf",
            updatedAt: "2026-03-12",
            summary: "BOQ เบื้องต้นสำหรับงานบันได built-in และ custom furniture.",
            latest: true,
          },
        ],
      },
      {
        id: "timeline",
        title: "Timeline",
        description: "แผนงานตกแต่ง loft condo",
        items: [
          {
            id: "condo-rat-timeline-v1",
            checked: false,
            rooms: [{ name: "ทั้งห้อง", description: "แผนงานเบื้องต้น" }],
            title: "Renovation Timeline",
            version: "Revise 01",
            kind: "pdf",
            updatedAt: "2026-03-12",
            summary: "แผนงานเบื้องต้นรวมงานบันไดและ built-in.",
            latest: true,
          },
        ],
      },
    ],
  },
  {
    slug: "cowork-space-thonglor-j2m6",
    code: "J2M6",
    title: "Thonglor Co-working Space",
    clientName: "WorkHub Co.",
    projectType: "Commercial",
    location: "Bangkok",
    stage: "revision",
    revisionStatus: "doing",
    createdAt: "2025-12-05",
    updatedAt: "2026-02-28",
    retentionUntil: "2029-02-28",
    shareMode: "Cloudflare Access by email",
    viewerCount: 4,
    overview:
      "ออกแบบ co-working space 3 ชั้น รวม private office, hot desk, meeting room และ cafe lounge.",
    nextMilestone: "ส่ง Revise 02 ของ Design และ Construction Drawing",
    ownerNote: "มี stakeholder หลายคน ต้อง revise หลายรอบ ควรเก็บ archive ทุก version",
    area: "450 ตร.ม.",
    year: "2025",
    gallery: [
      { id: "r1", name: "Reception", images: [
        { id: "g-1", src: "/gallery/cowork-thonglor/reception-01.jpg", caption: "Reception - Plant Wall" },
      ]},
      { id: "r2", name: "Hot Desk", images: [
        { id: "g-2", src: "/gallery/cowork-thonglor/hotdesk-01.jpg", caption: "Hot Desk Area - Open Plan" },
      ]},
    ],
    sections: [
      {
        id: "mood-tone",
        title: "Mood & Tone",
        description: "โทน creative professional สำหรับ co-working",
        items: [
          {
            id: "cowork-mood-v2",
            checked: true,
            rooms: [{ name: "Common area", description: "Warm grey + plant wall" }, { name: "Private office", description: "โทนสงบ" }],
            title: "Creative Professional Palette",
            version: "Revise 02",
            kind: "canva",
            updatedAt: "2026-02-20",
            summary: "โทน warm grey + wood accent + green plant wall สำหรับ common area.",
            latest: true,
          },
          {
            id: "cowork-mood-v1",
            checked: true,
            rooms: [{ name: "ทั้งอาคาร", description: "เปรียบเทียบ mood" }],
            title: "Creative Professional Palette",
            version: "Revise 01",
            kind: "canva",
            updatedAt: "2026-01-15",
            summary: "เวอร์ชันแรกเปรียบเทียบ corporate vs casual co-working mood.",
          },
        ],
      },
      {
        id: "design",
        title: "Design",
        description: "Layout 3 ชั้นรวม zoning และ furniture plan",
        items: [
          {
            id: "cowork-design-v2",
            checked: false,
            rooms: [{ name: "ชั้น 1", description: "Cafe lounge update" }, { name: "ชั้น 2", description: "Meeting room layout" }],
            title: "Co-working Design Pack",
            version: "Revise 02",
            kind: "pdf",
            updatedAt: "2026-02-28",
            summary: "อัปเดต layout meeting room ชั้น 2 และ cafe lounge ชั้น 1.",
            latest: true,
          },
          {
            id: "cowork-design-v1",
            checked: true,
            rooms: [{ name: "ทั้งอาคาร", description: "Zoning 3 ชั้น" }],
            title: "Co-working Design Pack",
            version: "Revise 01",
            kind: "pdf",
            updatedAt: "2026-01-25",
            summary: "แบบร่างแรกรวม zoning ทั้ง 3 ชั้น.",
          },
        ],
      },
      {
        id: "construction",
        title: "Construction Drawing",
        description: "แบบก่อสร้างสำหรับ partition, M&E และ built-in",
        items: [
          {
            id: "cowork-construction-v1",
            checked: false,
            rooms: [{ name: "ชั้น 1", description: "Reception counter" }, { name: "ทั้งอาคาร", description: "Partition + M&E" }],
            title: "Co-working Drawing Set",
            version: "Revise 01",
            kind: "pdf",
            updatedAt: "2026-02-25",
            summary: "แบบ partition, electrical plan และ built-in reception counter.",
            latest: true,
          },
        ],
      },
      {
        id: "boq",
        title: "BOQ",
        description: "ประมาณราคาสำหรับ co-working space 3 ชั้น",
        items: [
          {
            id: "cowork-boq-v1",
            checked: false,
            rooms: [{ name: "ทั้งอาคาร", description: "BOQ partition + furniture" }],
            title: "BOQ Package",
            version: "Revise 01",
            kind: "pdf",
            updatedAt: "2026-02-22",
            summary: "BOQ รวม partition system, furniture, M&E และ signage.",
            latest: true,
          },
        ],
      },
      {
        id: "timeline",
        title: "Timeline",
        description: "แผนงานก่อสร้าง co-working space 3 ชั้น",
        items: [
          {
            id: "cowork-timeline-v1",
            checked: false,
            rooms: [{ name: "ทั้งอาคาร", description: "แผนงาน 3 phase" }],
            title: "Construction Timeline",
            version: "Revise 01",
            kind: "pdf",
            updatedAt: "2026-02-28",
            summary: "แผนงาน 3 phase สำหรับชั้น 1-3 ตามลำดับ.",
            latest: true,
          },
        ],
      },
    ],
  },
  {
    slug: "pattanakan-house-w3n5",
    code: "W3N5",
    title: "Pattanakan Modern House",
    clientName: "Khun Top",
    projectType: "House",
    location: "Bangkok",
    stage: "construction",
    revisionStatus: "done",
    createdAt: "2025-10-15",
    updatedAt: "2026-01-20",
    retentionUntil: "2029-01-20",
    shareMode: "Cloudflare Access by email",
    viewerCount: 2,
    overview:
      "บ้านเดี่ยว 3 ชั้น สไตล์ Modern Tropical เน้น natural ventilation และ indoor-outdoor connection.",
    nextMilestone: "งาน construction เริ่มแล้ว รอติดตามหน้างาน",
    ownerNote: "โปรเจกต์นี้ปิดแบบแล้ว ลูกค้าใช้ดู drawing หน้างาน",
    area: "480 ตร.ม.",
    year: "2025",
    gallery: [
      { id: "r1", name: "ภายนอก", images: [
        { id: "g-1", src: "/gallery/pattanakan-house/exterior-01.jpg", caption: "Modern Tropical Facade" },
      ]},
      { id: "r2", name: "ห้องนั่งเล่น", images: [
        { id: "g-2", src: "/gallery/pattanakan-house/living-01.jpg", caption: "Double Height Living" },
      ]},
      { id: "r3", name: "สระว่ายน้ำ", images: [
        { id: "g-3", src: "/gallery/pattanakan-house/pool-01.jpg", caption: "Indoor-Outdoor Pool" },
      ]},
      { id: "r4", name: "ห้องนอนใหญ่", images: [
        { id: "g-4", src: "/gallery/pattanakan-house/master-01.jpg", caption: "Master Bedroom - Garden View" },
      ]},
      { id: "r5", name: "ห้องครัว", images: [
        { id: "g-5", src: "/gallery/pattanakan-house/kitchen-01.jpg", caption: "Island Counter" },
      ]},
    ],
    sections: [
      {
        id: "mood-tone",
        title: "Mood & Tone",
        description: "Modern Tropical mood สำหรับบ้าน 3 ชั้น",
        items: [
          {
            id: "house-pat-mood-v2",
            checked: true,
            rooms: [{ name: "ภายนอก", description: "โทน facade + landscape" }, { name: "ภายใน", description: "ไม้ + หิน + ต้นไม้" }],
            title: "Modern Tropical Direction",
            version: "Revise 02",
            kind: "canva",
            updatedAt: "2025-12-10",
            summary: "โทนไม้ธรรมชาติ + หินเทา + ต้นไม้เขียว approved แล้ว.",
            latest: true,
          },
          {
            id: "house-pat-mood-v1",
            checked: true,
            rooms: [{ name: "ทั้งหลัง", description: "เปรียบเทียบ tropical style" }],
            title: "Modern Tropical Direction",
            version: "Revise 01",
            kind: "canva",
            updatedAt: "2025-11-20",
            summary: "เวอร์ชันแรกเทียบ tropical minimal vs tropical luxe.",
          },
        ],
      },
      {
        id: "design",
        title: "Design",
        description: "แบบนำเสนอทุกชั้นรวม landscape",
        items: [
          {
            id: "house-pat-design-v3",
            checked: true,
            rooms: [{ name: "ทั้งหลัง", description: "Final + landscape plan" }],
            title: "House Design Presentation",
            version: "Revise 03",
            kind: "pdf",
            updatedAt: "2026-01-10",
            summary: "เวอร์ชัน final ที่ approved แล้วรวม landscape plan.",
            latest: true,
          },
          {
            id: "house-pat-design-v2",
            checked: true,
            rooms: [{ name: "ห้องนอนใหญ่", description: "ปรับ layout" }, { name: "สระว่ายน้ำ", description: "Pool area" }],
            title: "House Design Presentation",
            version: "Revise 02",
            kind: "pdf",
            updatedAt: "2025-12-20",
            summary: "ปรับ master bedroom layout และ pool area.",
          },
          {
            id: "house-pat-design-v1",
            checked: true,
            rooms: [{ name: "ทั้งหลัง", description: "Zoning 3 ชั้น" }],
            title: "House Design Presentation",
            version: "Revise 01",
            kind: "pdf",
            updatedAt: "2025-11-25",
            summary: "แบบร่างแรกรวม zoning ทั้ง 3 ชั้น.",
          },
        ],
      },
      {
        id: "construction",
        title: "Construction Drawing",
        description: "แบบก่อสร้างชุดเต็มสำหรับผู้รับเหมา",
        items: [
          {
            id: "house-pat-construction-v2",
            checked: true,
            rooms: [{ name: "ทั้งหลัง", description: "Final drawing set" }],
            title: "Construction Drawing Set",
            version: "Revise 02",
            kind: "pdf",
            updatedAt: "2026-01-20",
            summary: "แบบ final สำหรับก่อสร้างรวม structural, M&E และ built-in ทุกจุด.",
            latest: true,
          },
          {
            id: "house-pat-construction-v1",
            checked: true,
            rooms: [{ name: "ทั้งหลัง", description: "Drawing เริ่มต้น" }],
            title: "Construction Drawing Set",
            version: "Revise 01",
            kind: "pdf",
            updatedAt: "2026-01-05",
            summary: "ชุดแรกก่อนปรับ detail บันไดและระเบียง.",
          },
        ],
      },
      {
        id: "boq",
        title: "BOQ",
        description: "BOQ ชุดเต็มสำหรับบ้าน 3 ชั้น",
        items: [
          {
            id: "house-pat-boq-v2",
            checked: true,
            rooms: [{ name: "ทั้งหลัง", description: "BOQ final + landscape" }],
            title: "BOQ Package",
            version: "Revise 02",
            kind: "pdf",
            updatedAt: "2026-01-15",
            summary: "BOQ final รวมงาน landscape และ pool.",
            latest: true,
          },
          {
            id: "house-pat-boq-v1",
            checked: true,
            rooms: [{ name: "ทั้งหลัง", description: "BOQ เบื้องต้น" }],
            title: "BOQ Package",
            version: "Revise 01",
            kind: "pdf",
            updatedAt: "2025-12-28",
            summary: "BOQ เบื้องต้นก่อนเพิ่มรายการ landscape.",
          },
        ],
      },
      {
        id: "timeline",
        title: "Timeline",
        description: "แผนงานก่อสร้างบ้าน 3 ชั้น",
        items: [
          {
            id: "house-pat-timeline-v2",
            checked: true,
            rooms: [{ name: "ทั้งหลัง", description: "อัปเดต landscape + pool" }],
            title: "Construction Timeline",
            version: "Revise 02",
            kind: "pdf",
            updatedAt: "2026-01-20",
            summary: "แผนงานอัปเดตรวม landscape และ pool construction.",
            latest: true,
          },
          {
            id: "house-pat-timeline-v1",
            checked: true,
            rooms: [{ name: "ทั้งหลัง", description: "แผนงานเริ่มต้น" }],
            title: "Construction Timeline",
            version: "Revise 01",
            kind: "pdf",
            updatedAt: "2025-12-28",
            summary: "แผนงานเริ่มต้นสำหรับงาน structural และ M&E.",
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

const defaultTodos: TodoItem[] = [
  {
    id: "todo-1",
    title: "ส่ง Revise 03 แบบ Mood & Tone ให้ลูกค้า",
    description: "ปรับโทนผนังห้องนั่งเล่น + เพิ่ม warm lighting ห้องนอนใหญ่",
    status: "in-progress",
    priority: "high",
    projectSlug: "riverside-residence-b7x2",
    createdAt: "2026-03-10",
  },
  {
    id: "todo-2",
    title: "อัปเดต BOQ ราคาวัสดุห้องครัว",
    description: "เปลี่ยน countertop จาก marble เป็น engineered stone ตามที่ลูกค้าแจ้ง",
    status: "pending",
    priority: "high",
    projectSlug: "riverside-residence-b7x2",
    createdAt: "2026-03-12",
  },
  {
    id: "todo-3",
    title: "Export Construction Drawing ชุดเต็ม",
    description: "รอลูกค้า approve Revise 03 ก่อน แล้วค่อย export PDF print",
    status: "pending",
    priority: "medium",
    projectSlug: "riverside-residence-b7x2",
    createdAt: "2026-03-14",
  },
  {
    id: "todo-4",
    title: "เตรียม Mood Board สำหรับ Nordic Home Office",
    description: "ลูกค้าต้องการสไตล์ Scandinavian + Japanese minimal",
    status: "pending",
    priority: "medium",
    projectSlug: "nordic-home-office-l2k7",
    createdAt: "2026-03-08",
  },
  {
    id: "todo-5",
    title: "ถ่ายรูปงานเสร็จ Atelier Cafe",
    description: "นัดช่างภาพถ่ายงานเสร็จเพื่อลง Gallery",
    status: "completed",
    priority: "low",
    projectSlug: "atelier-cafe-renovation-m4p1",
    createdAt: "2026-02-20",
    completedAt: "2026-03-05",
  },
  {
    id: "todo-6",
    title: "ส่ง Timeline อัปเดตให้ผู้รับเหมา",
    description: "Export จาก Microsoft Project แล้วอัปเดตในระบบ",
    status: "in-progress",
    priority: "medium",
    projectSlug: "sukhumvit-condo-unit-k9r3",
    createdAt: "2026-03-11",
  },
  {
    id: "todo-7",
    title: "ตรวจงาน site visit Pattanakan",
    description: "เช็คงานติดตั้งเฟอร์นิเจอร์ built-in ห้องนอน + ห้องนั่งเล่น",
    status: "completed",
    priority: "high",
    projectSlug: "pattanakan-modern-house-w3n5",
    createdAt: "2026-02-28",
    completedAt: "2026-03-15",
  },
  {
    id: "todo-8",
    title: "Review แบบ Co-working Space zone ประชุม",
    description: "ลูกค้าขอเพิ่ม partition กั้นเสียงระหว่างห้องประชุม",
    status: "pending",
    priority: "high",
    projectSlug: "thonglor-co-working-space-j2m6",
    createdAt: "2026-03-16",
  },
];

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
