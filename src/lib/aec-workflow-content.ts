export interface AecPillar {
  name: string;
  summary: string;
  outcome: string;
}

export interface AecAudience {
  role: string;
  painPoint: string;
  solution: string;
}

export interface AecStackItem {
  layer: string;
  technology: string;
  rationale: string;
}

export interface AecRoadmapPhase {
  name: string;
  duration: string;
  framework: string;
  deliverable: string;
  highlights: string[];
}

export interface AecBuildWeek {
  week: string;
  focus: string;
  outcome: string;
}

export interface AecMetric {
  name: string;
  baseline: string;
  threeMonth: string;
  sixMonth: string;
}

export interface AecRisk {
  name: string;
  impact: string;
  mitigation: string;
}

export const aecPlatformSummary = {
  title: "AEC Workflow Platform",
  subtitle:
    "Hybrid project management platform for architecture, engineering, and construction teams.",
  preparedAt: "March 2026",
  version: "1.0",
  promise:
    "รวม GTD, Kanban, Lean, CPM และ Agile mindset ไว้ใน workflow เดียว เพื่อให้ทีมเห็น bottleneck, จำกัด WIP และลดงานซ้ำที่ไม่สร้างมูลค่า.",
  target:
    "ลด lead time เฉลี่ย 25-30% ภายใน 6 เดือนหลัง launch ด้วย metrics, automation และ weekly review ที่ใช้งานจริงทุกวัน.",
};

export const aecPillars: AecPillar[] = [
  {
    name: "GTD",
    summary: "Inbox, clarify flow, next actions, waiting for, weekly review.",
    outcome: "คุมงานส่วนตัวหลายโปรเจกต์โดยไม่หลุด follow-up",
  },
  {
    name: "Kanban",
    summary: "Board ต่อโปรเจกต์, drag-and-drop, WIP limits, workload visibility.",
    outcome: "ลด multitask และเห็นคอขวดของทีมแบบ real-time",
  },
  {
    name: "Lean",
    summary: "Value stream map, waste detection, retrospective, improvement loop.",
    outcome: "เปลี่ยน data จากงานประจำวันเป็น process insight ที่แก้ได้จริง",
  },
  {
    name: "CPM",
    summary: "Gantt chart, critical path, dependencies, CA tools.",
    outcome: "ต่อจาก design phase ไป construction phase ได้ในระบบเดียว",
  },
  {
    name: "Agile",
    summary: "Progressive delivery, phased launch, dogfooding, fast iteration.",
    outcome: "ส่งของทีละ phase โดยยังใช้งานจริงและเก็บ feedback ต่อเนื่อง",
  },
];

export const aecAudience: AecAudience[] = [
  {
    role: "สถาปนิก (individual)",
    painPoint: "คุม 3-5 โปรเจกต์พร้อมกันแล้วจำ next step ไม่หมด",
    solution: "GTD inbox + context filtering + guided weekly review",
  },
  {
    role: "Team lead",
    painPoint: "ไม่เห็นว่าใครติดงานอะไร ใครเกิน capacity",
    solution: "Kanban board + WIP limits + workload view",
  },
  {
    role: "Project manager",
    painPoint: "lead time นาน แต่ไม่รู้ bottleneck อยู่ตรงไหน",
    solution: "Lean analytics + value stream map + CPM planning",
  },
  {
    role: "เจ้าของออฟฟิศ",
    painPoint: "มอง profitability และ time spent ต่อโปรเจกต์ไม่ชัด",
    solution: "Dashboard ที่เทียบ progress, budgeted effort และ throughput",
  },
];

export const aecTechStack: AecStackItem[] = [
  {
    layer: "Frontend",
    technology: "Next.js + React + TypeScript",
    rationale: "App Router และ SSR เหมาะกับ dashboard ที่ต้องขยายต่อได้",
  },
  {
    layer: "UI",
    technology: "Tailwind CSS + shadcn/ui",
    rationale: "สร้าง component ได้เร็วและคุม visual language ได้ง่าย",
  },
  {
    layer: "State",
    technology: "Zustand + React Query",
    rationale: "เบาและเหมาะกับ server state ที่ sync บ่อย",
  },
  {
    layer: "Backend",
    technology: "Supabase",
    rationale: "มี PostgreSQL, Auth, Realtime และเริ่มต้นได้เร็ว",
  },
  {
    layer: "AI",
    technology: "Anthropic Claude API",
    rationale: "ใช้สรุป weekly review, bottleneck และ next action",
  },
  {
    layer: "Board UX",
    technology: "dnd-kit",
    rationale: "drag-and-drop ลื่นและรองรับ touch/mobile",
  },
  {
    layer: "Analytics",
    technology: "Recharts + D3",
    rationale: "Recharts สำหรับ dashboard และ D3 สำหรับ Gantt/VSM ที่ซับซ้อน",
  },
  {
    layer: "Deploy",
    technology: "Vercel",
    rationale: "ต่อกับ Next.js ง่ายและส่งของผ่าน Git ได้เร็ว",
  },
];

export const aecRoadmap: AecRoadmapPhase[] = [
  {
    name: "Phase 1: MVP",
    duration: "4-5 weeks",
    framework: "GTD + Basic Kanban",
    deliverable: "ใช้เองทุกวันได้จริง",
    highlights: [
      "GTD inbox + 6 buckets + clarify flow",
      "Kanban board 4 columns พร้อม WIP limit",
      "Auth + realtime sync ข้ามอุปกรณ์",
    ],
  },
  {
    name: "Phase 2: Team Kanban + Metrics",
    duration: "4-5 weeks",
    framework: "Collaboration + Metrics",
    deliverable: "ทีม 3-5 คนใช้งานร่วมกันได้",
    highlights: [
      "Invite team และ assignment",
      "Custom columns, notifications, presence",
      "Lead time, cycle time, throughput tracking",
    ],
  },
  {
    name: "Phase 3: Lean Analytics + VSM",
    duration: "4 weeks",
    framework: "Lean",
    deliverable: "เห็น waste และ process improvement ได้ชัด",
    highlights: [
      "Value stream map builder",
      "AI waste detector และ A3 report",
      "Efficiency dashboard และ set-based design tracker",
    ],
  },
  {
    name: "Phase 4: CPM + CA Tools",
    duration: "4-5 weeks",
    framework: "CPM",
    deliverable: "ใช้กับ construction administration ได้",
    highlights: [
      "Interactive Gantt + critical path auto-calc",
      "RFI/Submittal tracker และ deadline alerts",
      "Last Planner + site diary + photo log",
    ],
  },
  {
    name: "Phase 5: AI Assistant + Launch",
    duration: "4-5 weeks",
    framework: "AI + Agile polish",
    deliverable: "พร้อม public launch",
    highlights: [
      "AI weekly review และ smart next action",
      "Predictive analytics และ natural language capture",
      "Client portal, onboarding, mobile PWA",
    ],
  },
];

export const aecMvpWeeks: AecBuildWeek[] = [
  {
    week: "Week 1",
    focus: "Auth + Database + GTD Inbox",
    outcome: "login ได้, สร้าง GTD item ได้, sync ข้ามแท็บได้จริง",
  },
  {
    week: "Week 2",
    focus: "GTD Buckets + Process Flow",
    outcome: "capture, clarify, organize, review ได้ครบ GTD loop",
  },
  {
    week: "Week 3",
    focus: "Kanban Board",
    outcome: "board ใช้งานได้พร้อม drag-drop, card CRUD และ WIP limits",
  },
  {
    week: "Week 4",
    focus: "Integration + Metrics",
    outcome: "GTD เชื่อม Kanban และวัด lead time / cycle time / throughput ได้",
  },
  {
    week: "Week 5",
    focus: "Polish + Deploy MVP",
    outcome: "responsive, PWA, onboarding และขึ้น production ได้",
  },
];

export const aecMetrics: AecMetric[] = [
  {
    name: "Daily active usage",
    baseline: "0",
    threeMonth: "5 days/week",
    sixMonth: "5 days/week",
  },
  {
    name: "GTD inbox processed daily",
    baseline: "N/A",
    threeMonth: "> 80%",
    sixMonth: "> 90%",
  },
  {
    name: "Average cycle time",
    baseline: "Unknown",
    threeMonth: "Measured",
    sixMonth: "-20% from baseline",
  },
  {
    name: "Value ratio (VSM)",
    baseline: "~40%",
    threeMonth: "50%",
    sixMonth: "60%",
  },
];

export const aecRisks: AecRisk[] = [
  {
    name: "Scope creep",
    impact: "High",
    mitigation: "ยึด phase plan อย่างเคร่งครัด และให้ MVP มีแค่ GTD + basic Kanban",
  },
  {
    name: "ทีมไม่ adopt",
    impact: "High",
    mitigation: "ใช้เองก่อน 4 สัปดาห์และทำ onboarding ให้ลื่นก่อนชวนทีม",
  },
  {
    name: "AI cost สูงเกินไป",
    impact: "Medium",
    mitigation: "ใช้ model ตาม complexity และ cache งานที่เรียกซ้ำ",
  },
  {
    name: "เวลา dev ไม่พอ",
    impact: "High",
    mitigation: "ตั้ง WIP limit ของงาน dev เองไม่เกิน 2 features ต่อสัปดาห์",
  },
];

export const aecNextSteps = [
  "ตั้ง repo และ deploy pipeline ให้พร้อมก่อนเริ่ม Phase 1",
  "สร้าง Supabase project พร้อม schema หลัก, Auth และ Realtime",
  "เริ่มจาก GTD inbox CRUD + realtime sync ก่อนเสมอ",
  "ใช้ระบบนี้กับงานจริงตั้งแต่สัปดาห์แรกเพื่อเก็บ feedback loop",
];
