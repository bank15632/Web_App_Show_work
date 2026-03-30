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

export interface AecPhaseModule {
  id: string;
  shortLabel: string;
  name: string;
  duration: string;
  objective: string;
  summary: string;
  modules: AecWorkflowModule[];
  buildChecklist: string[];
}

export interface AecWorkflowModule {
  name: string;
  status: "live" | "partial" | "planned";
  summary: string;
  deliverable: string;
  currentFit: string;
  launchHref?: string;
  launchLabel?: string;
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

export const aecPhaseModules: AecPhaseModule[] = [
  {
    id: "phase-1",
    shortLabel: "MVP",
    name: "Phase 1: Personal GTD + Basic Kanban",
    duration: "4-5 weeks",
    objective: "ทำระบบที่ใช้เองทุกวันได้จริงก่อน แล้วค่อยขยาย",
    summary:
      "เริ่มจาก command center ส่วนตัว: งานเข้า, board หลัก, quick capture, weekly review และ workflow ที่ไม่ต้องสลับหลายเครื่องมือ.",
    modules: [
      {
        name: "Project Command Board",
        status: "live",
        summary:
          "หน้า tracker ปัจจุบันใช้เป็น execution board กลางของโปรเจกต์ได้แล้ว พร้อม task lanes, quick add และ project context.",
        deliverable: "Kanban-style execution workspace สำหรับงานจริง",
        currentFit: "ใช้แทน basic Kanban ของ roadmap ได้ทันที",
        launchHref: "/todos",
        launchLabel: "Open Kanban board",
      },
      {
        name: "AI Chat Brief Export",
        status: "live",
        summary:
          "มีปุ่มคัดลอก context ของโปรเจกต์ออกไปให้ใช้กับ AI chat ภายนอกตาม workflow ที่คุณเลือกแล้ว.",
        deliverable: "Brief พร้อม copy/download สำหรับ external AI",
        currentFit: "แทนชั้น AI ในช่วงแรกโดยไม่ต้องผูก API เพิ่ม",
        launchHref: "/todos",
        launchLabel: "Copy from Kanban board",
      },
      {
        name: "Workspace Header + Quick Intake",
        status: "partial",
        summary:
          "มี project summary, phase/status control, quick add task และ intake entrypoints แล้ว แต่ยังไม่ใช่ GTD inbox เต็มรูปแบบ.",
        deliverable: "Capture + project context ในจุดเดียว",
        currentFit: "พร้อมใช้เป็น bridge ระหว่าง project planning กับ execution",
        launchHref: "/todos",
        launchLabel: "Review workspace",
      },
      {
        name: "GTD Inbox + Weekly Review",
        status: "live",
        summary:
          "มี route แยกสำหรับ quick capture, GTD buckets, clarify flow, context filtering และ weekly review brief แล้ว.",
        deliverable: "Personal GTD workspace ที่หยิบใช้ได้ทันที",
        currentFit: "ใช้เป็น command center ส่วนตัวควบคู่กับ tracker project board ได้แล้ว",
        launchHref: "/gtd",
        launchLabel: "Open GTD workspace",
      },
    ],
    buildChecklist: [
      "ใช้หน้า tracker กับงานจริงทุกวันก่อน",
      "แยก GTD buckets ออกจาก task board ให้ชัด",
      "ต่อ GTD workspace เข้ากับ task data จริงเมื่อ schema พร้อม",
      "วัด friction จุดที่ทำให้หยุดใช้ภายใน 2 สัปดาห์แรก",
    ],
  },
  {
    id: "phase-2",
    shortLabel: "Team",
    name: "Phase 2: Team Kanban + Metrics",
    duration: "4-5 weeks",
    objective: "เปลี่ยนจากใช้งานคนเดียวเป็นใช้ร่วมกับทีม 3-5 คน",
    summary:
      "ต่อยอดจาก board ปัจจุบันไปสู่ assignment, workload, notifications และ metrics ที่ตอบคำถามทีม lead ได้จริง.",
    modules: [
      {
        name: "Team Assignment + Presence",
        status: "planned",
        summary:
          "invite team, online presence, assignment และ activity feed ยังไม่มีในระบบปัจจุบัน.",
        deliverable: "Collaborative board สำหรับทีม",
        currentFit: "ต้องเพิ่ม auth/team layer ก่อน",
      },
      {
        name: "Board Metrics Dashboard",
        status: "partial",
        summary:
          "dashboard ปัจจุบันมีภาพรวมโปรเจกต์แล้ว แต่ยังไม่วัด lead time, cycle time, throughput ตาม roadmap.",
        deliverable: "ทีมเห็น performance และ bottleneck รายสัปดาห์",
        currentFit: "มีฐาน UI แล้ว เหลือเติม event tracking และ charts",
        launchHref: "/",
        launchLabel: "Open dashboard",
      },
      {
        name: "Custom Columns + Workload View",
        status: "planned",
        summary:
          "board ยัง fix lanes อยู่และยังไม่มี view แยกตาม assignee หรือ capacity.",
        deliverable: "Board ที่ปรับตาม phase และ workload ได้",
        currentFit: "แตกต่อจาก task board เดิมได้โดยไม่รื้อทั้งหน้า",
      },
    ],
    buildChecklist: [
      "เพิ่ม team/member schema ให้ละเอียดก่อน",
      "record card moves ทุกครั้งเพื่อคำนวณ metrics",
      "เติม workload view และ assignment filters",
      "ออกแบบ notification ที่ไม่รบกวนเกินไป",
    ],
  },
  {
    id: "phase-3",
    shortLabel: "Lean",
    name: "Phase 3: Lean Analytics + Value Stream",
    duration: "4 weeks",
    objective: "เปลี่ยน workflow data ให้กลายเป็น process improvement system",
    summary:
      "หลังมีข้อมูลจากการใช้งานจริงแล้ว ค่อยแตก VSM, waste analysis, A3 และ retrospective ให้มีความหมาย.",
    modules: [
      {
        name: "Value Stream Map Builder",
        status: "planned",
        summary:
          "interactive map สำหรับ process steps, work time, wait time และ value ratio ยังไม่มี route ของตัวเอง.",
        deliverable: "VSM ที่เทียบ before/after ได้",
        currentFit: "เหมาะทำเป็นหน้าใหม่ใน analytics lane",
      },
      {
        name: "Waste Detector + A3 Reports",
        status: "planned",
        summary:
          "เอกสารเสนอ AI วิเคราะห์ DOWNTIME waste และต่อไปยัง A3 problem-solving sheet.",
        deliverable: "Actionable improvement report",
        currentFit: "ต้องมี metrics history ก่อนจึงจะน่าเชื่อถือ",
      },
      {
        name: "Efficiency Dashboard",
        status: "planned",
        summary:
          "ยังไม่มี visual layer สำหรับ value ratio, waste mix และ trend ต่อ project.",
        deliverable: "Lean analytics dashboard",
        currentFit: "ต่อจาก phase 2 metrics ได้ตรงๆ",
      },
    ],
    buildChecklist: [
      "เก็บ move history ให้ครบก่อนเริ่ม analytics",
      "กำหนดสูตร value ratio และ waste taxonomy ให้ชัด",
      "เริ่มจาก dashboard อ่านง่ายก่อน interactive tools",
    ],
  },
  {
    id: "phase-4",
    shortLabel: "CPM",
    name: "Phase 4: CPM + CA Tools",
    duration: "4-5 weeks",
    objective: "ขยายจาก design workflow ไปสู่ construction administration",
    summary:
      "เพิ่ม planning และ CA modules ที่เชื่อม schedule, dependencies, RFIs, submittals และ site updates เข้าด้วยกัน.",
    modules: [
      {
        name: "Gantt + Critical Path",
        status: "planned",
        summary:
          "ยังไม่มี schedule engine หรือ dependency visualization สำหรับงานก่อสร้าง.",
        deliverable: "Interactive Gantt พร้อม critical path",
        currentFit: "เหมาะเป็น module ใหญ่แยกจาก tracker task board",
      },
      {
        name: "RFI + Submittal Tracker",
        status: "planned",
        summary:
          "สามารถต่อยอดจาก task/revision logic เดิมได้ แต่ยังไม่มี board เฉพาะสาย CA.",
        deliverable: "Dedicated CA workflow boards",
        currentFit: "reuse schema/task types บางส่วนจาก tracker เดิมได้",
      },
      {
        name: "Site Diary + Progress Log",
        status: "planned",
        summary:
          "photo log และ field capture ยังไม่ถูกแยกเป็น daily site module.",
        deliverable: "Daily construction log ที่โยงกับ activities",
        currentFit: "เป็น bridge สำคัญก่อนไป predictive analytics",
      },
    ],
    buildChecklist: [
      "ตัดสินใจก่อนว่าจะใช้ D3 หรือ component abstraction แบบไหน",
      "กำหนด activity/dependency schema ให้ไม่ตันตอน scale",
      "เชื่อม site capture กับ progress updates ตั้งแต่แรก",
    ],
  },
  {
    id: "phase-5",
    shortLabel: "Launch",
    name: "Phase 5: AI Assistant + Public Launch",
    duration: "4-5 weeks",
    objective: "ทำให้ระบบพร้อมเปิดใช้ภายนอกและมี AI layer ที่ช่วยตัดสินใจได้จริง",
    summary:
      "AI ควรมาหลัง workflow หลักนิ่งแล้ว ปัจจุบันมี external AI brief workflow และ client rooms เป็นฐานให้ต่อยอดได้.",
    modules: [
      {
        name: "AI Weekly Review",
        status: "partial",
        summary:
          "ตอนนี้ใช้แนวทาง export brief ไป AI ภายนอกได้แล้ว แต่ยังไม่มี weekly review automation ในระบบเอง.",
        deliverable: "Summary และ recommendations รายสัปดาห์",
        currentFit: "มี workflow ใช้งานจริงแล้วผ่าน Copy for AI chat",
        launchHref: "/todos",
        launchLabel: "Use export workflow",
      },
      {
        name: "Client Portal",
        status: "live",
        summary:
          "dashboard และ client rooms ที่มีอยู่เป็นฐาน portal ฝั่งลูกค้า/owner ได้แล้ว แม้ยังไม่ใช่ approval workflow เต็มรูปแบบ.",
        deliverable: "External-facing project visibility",
        currentFit: "ใช้งานเป็น client-facing layer ได้ทันที",
        launchHref: "/",
        launchLabel: "Open client rooms",
      },
      {
        name: "Predictive Insights + Smart Next Action",
        status: "planned",
        summary:
          "ยังไม่มี historical engine ที่พอสำหรับ forecast completion, risk flags หรือ AI recommendations ภายในระบบ.",
        deliverable: "Insight engine ระดับ production",
        currentFit: "ต้องรอ metrics และ activity history สะสมก่อน",
      },
    ],
    buildChecklist: [
      "ใช้ external AI workflow ไปก่อนจน prompt/data shape นิ่ง",
      "นิยาม approval flow ของ client portal ให้ชัด",
      "เก็บ historical metrics ก่อนเริ่ม forecast features",
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
