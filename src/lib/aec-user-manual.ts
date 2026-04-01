export interface ManualFrameworkCard {
  name: string;
  role: string;
  whenToUse: string;
  status: "available" | "partial" | "planned";
  href?: string;
  actionLabel?: string;
  guideHref?: string;
  guideActionLabel?: string;
}

export interface ManualDashboardPanel {
  title: string;
  body: string;
}

export interface ManualRoutineStep {
  time: string;
  action: string;
  module: string;
  duration: string;
}

export interface ManualSettingsCard {
  title: string;
  body: string;
  status: "available" | "partial" | "planned";
}

export interface ManualFaqItem {
  question: string;
  answer: string;
}

export type ManualSystemSlug =
  | "gtd"
  | "kanban"
  | "lean"
  | "cpm"
  | "ai-assistant";

export interface ManualSystemAction {
  label: string;
  href: string;
}

export interface ManualSystemReferenceGroup {
  title: string;
  items: Array<{
    label: string;
    body: string;
  }>;
}

export interface ManualSystemGuide {
  slug: ManualSystemSlug;
  name: string;
  role: string;
  status: "available" | "partial" | "planned";
  pageHref: string;
  overview: string;
  whenToUse: string;
  cadence: string;
  quickStart: string[];
  routine: Array<{
    title: string;
    body: string;
  }>;
  outputs: string[];
  guardrail: string;
  statusNote: string;
  actions: ManualSystemAction[];
  referenceGroups?: ManualSystemReferenceGroup[];
}

export const manualFrameworkCards: ManualFrameworkCard[] = [
  {
    name: "GTD",
    role: "จัดการงานส่วนตัว",
    whenToUse: "ทุกวัน: capture, process, review",
    status: "available",
    href: "/gtd",
    actionLabel: "Open GTD workspace",
    guideHref: "/gtd/guide",
    guideActionLabel: "Open GTD guide",
  },
  {
    name: "Kanban",
    role: "จัดการทีม + โปรเจกต์",
    whenToUse: "ทุกวัน: ดูสถานะงาน, ย้าย cards, จำกัด WIP",
    status: "available",
    href: "/todos",
    actionLabel: "Open Kanban board",
    guideHref: "/todos/guide",
    guideActionLabel: "Open Kanban guide",
  },
  {
    name: "Lean",
    role: "วิเคราะห์ + ลด waste",
    whenToUse: "จบทุก phase: VSM, retrospective, kaizen",
    status: "planned",
    href: "/lean",
    actionLabel: "Open Lean guide",
  },
  {
    name: "CPM",
    role: "วางแผนก่อสร้าง",
    whenToUse: "CA phase: Gantt chart, RFI, Last Planner",
    status: "planned",
    href: "/cpm",
    actionLabel: "Open CPM guide",
  },
  {
    name: "AI Assistant",
    role: "วิเคราะห์ + แนะนำ",
    whenToUse: "ทุกสัปดาห์: สรุป, พยากรณ์, แนะนำ next action",
    status: "partial",
    href: "/todos",
    actionLabel: "Use AI brief",
    guideHref: "/ai-assistant",
    guideActionLabel: "Open AI guide",
  },
];

export const manualDashboardPanels: ManualDashboardPanel[] = [
  {
    title: "Outstanding Tasks",
    body: "จำนวนงานค้างรวมจาก GTD และ Kanban พร้อมภาพรวมว่า backlog กระจุกอยู่ในระบบใดมากกว่า",
  },
  {
    title: "GTD Analytics",
    body: "กราฟ GTD แยกเฉพาะระบบเพื่อดู bucket ที่ค้างและจังหวะการปิดงานใน 7 วันล่าสุด",
  },
  {
    title: "Kanban Analytics",
    body: "กราฟ Kanban แยกเฉพาะระบบเพื่อดู bottleneck ของบอร์ดและงานที่ทีมปิดได้จริงในรอบสัปดาห์",
  },
  {
    title: "Client Rooms",
    body: "ติดตามจำนวนโปรเจกต์ เอกสาร งานที่ต้อง publish และสถานะ draft / dirty / live ได้จากหน้าเดียว",
  },
  {
    title: "Deadline Health",
    body: "แยกงาน overdue, due today และ next 7 days เพื่อจัดลำดับความเสี่ยงให้เร็วขึ้น",
  },
];

export const manualDailyRoutine: ManualRoutineStep[] = [
  {
    time: "08:45",
    action: "เลือก task ที่จะทำ (กรอง context)",
    module: "GTD / Kanban",
    duration: "2 นาที",
  },
  {
    time: "09:00",
    action: "Deep work: ทำงานจริง",
    module: "โฟกัสงานจริง",
    duration: "2-3 ชม.",
  },
  {
    time: "12:00",
    action: "ย้าย cards ที่เสร็จ + capture items ใหม่",
    module: "Kanban + GTD",
    duration: "5 นาที",
  },
  {
    time: "16:30",
    action: "Process inbox รอบ 2 + update board",
    module: "GTD + Kanban",
    duration: "10 นาที",
  },
  {
    time: "ศุกร์ 15:00",
    action: "Weekly Review",
    module: "GTD",
    duration: "30-60 นาที",
  },
];

export const manualSettingsCards: ManualSettingsCard[] = [
  {
    title: "Profile",
    body: "ชื่อ + avatar, default context และ working hours สำหรับการใช้งานประจำวัน",
    status: "available",
  },
  {
    title: "Team Management",
    body: "invite สมาชิก, กำหนด role และย้าย cards กลับเป็น unassigned เมื่อถอดสมาชิกออก",
    status: "planned",
  },
  {
    title: "Notifications",
    body: "เปิด/ปิด weekly review, due dates, board changes และ AI summary แยกตามประเภท",
    status: "available",
  },
  {
    title: "Export",
    body: "เลือก CSV สำหรับ spreadsheet หรือ JSON สำหรับ developer ครอบคลุมข้อมูลที่ระบบเก็บอยู่ตอนนี้",
    status: "available",
  },
];

export const manualFaq: ManualFaqItem[] = [
  {
    question: "ต้องใช้ทุก module ตั้งแต่แรกไหม?",
    answer: "ไม่ต้อง เริ่มจาก GTD อย่างเดียว 2 สัปดาห์ แล้วค่อยเพิ่ม Kanban เมื่อ flow เริ่มนิ่ง",
  },
  {
    question: "GTD inbox กับ Kanban backlog ต่างกันยังไง?",
    answer: "GTD inbox คือที่จับทุกอย่างที่เข้าหัว ส่วน Kanban backlog คือ task ที่ผ่านการ process แล้วและทีมต้องเห็น",
  },
  {
    question: "WIP limit เท่าไหร่ดี?",
    answer: "เริ่มที่ 2-3 สำหรับคนเดียว และ 5-8 สำหรับทีม 3-5 คน จากนั้นค่อยปรับขึ้นลงตาม flow จริง",
  },
  {
    question: "ลืมทำ Weekly Review?",
    answer: "ระบบควรเตือนทุก 7 วัน, เกิน 10 วันให้ขึ้น banner แดง และถ้าหลุด 3 สัปดาห์ให้ทำ Brain Dump ใหม่",
  },
  {
    question: "export ข้อมูลได้ไหม?",
    answer: "ได้ ผ่าน Settings → Export โดยเลือก CSV สำหรับ spreadsheet หรือ JSON สำหรับ developer",
  },
];

export const manualSystemGuides: ManualSystemGuide[] = [
  {
    slug: "gtd",
    name: "GTD",
    role: "ระบบจัดการงานส่วนตัวก่อนส่งต่อเข้าระบบทีม",
    status: "available",
    pageHref: "/gtd",
    overview:
      "ใช้ GTD เป็นที่จับทุกอย่างที่เข้าหัวก่อนเสมอ แล้วค่อย clarify ให้กลายเป็น next action, waiting, calendar, someday หรือ reference ที่หยิบใช้ได้จริง",
    whenToUse:
      "ใช้ทุกวันตอนเริ่มงาน, ระหว่างวันเมื่อมีสิ่งแทรก, และตอนปิดวันเพื่อเคลียร์ inbox",
    cadence:
      "เช้า 2 นาที, กลางวัน 5 นาที, เย็น 10 นาที, ศุกร์ 30-60 นาทีสำหรับ weekly review",
    quickStart: [
      "พิมพ์ทุกเรื่องที่นึกออกลง inbox ก่อน อย่าจัดหมวดในหัว",
      "เปิด item ที่จับมาแล้วและเลือก bucket ที่ถูกต้องให้ชัด",
      "ใส่ context, priority, due date และ note เฉพาะงานที่ต้องหยิบทำจริง",
    ],
    routine: [
      {
        title: "Capture first",
        body: "ทุกงานใหม่, feedback, หรือ follow-up ให้ลง inbox ก่อนเพื่อกันหลุดจากหัว",
      },
      {
        title: "Clarify to one bucket",
        body: "แต่ละ item ต้องรู้ว่าจะทำเลย, รอคนอื่น, ผูกกับปฏิทิน, เก็บอ้างอิง หรือพักไว้ก่อน",
      },
      {
        title: "Review every week",
        body: "ทำ weekly review เพื่อรีเฟรช next actions, waiting for, calendar และ weekly focus",
      },
    ],
    outputs: [
      "Inbox ที่ใกล้ว่างและไม่กองค้าง",
      "Next actions ที่หยิบทำได้ทันที",
      "Waiting for ที่ follow up ได้ตรงเวลา",
      "Weekly focus ที่ชัดสำหรับสัปดาห์นี้",
    ],
    guardrail:
      "Kanban ไม่ใช่ inbox ถ้างานยังไม่ clarify อย่าโยนขึ้น board",
    statusNote:
      "หน้า GTD ใช้งานจริงได้แล้ว และข้อมูลถูกเก็บใน D1 ร่วมกับ weekly review",
    actions: [
      { label: "Open GTD workspace", href: "/gtd" },
      { label: "Open Dashboard", href: "/" },
      { label: "Settings & Export", href: "/settings" },
    ],
  },
  {
    slug: "kanban",
    name: "Kanban",
    role: "ระบบคุมงานทีมและสถานะโปรเจกต์ที่ผ่านการ process แล้ว",
    status: "available",
    pageHref: "/todos",
    overview:
      "ใช้ Kanban board เพื่อดูสถานะงานตามโปรเจกต์, จำกัดงานค้าง, ติดตาม review queue, และทำ weekly report โดยให้ทุก card เป็นงานที่ชัดและทีมเห็นร่วมกัน",
    whenToUse:
      "ใช้ทุกวันเพื่อเลือกงาน, อัปเดตสถานะหลังประชุม, และเช็ก blocker หรือ due date ที่กำลังจะถึง",
    cadence:
      "เช้า 2 นาทีดู saved view, หลังประชุมใช้ intake, ปลายวันอัปเดต card ที่ done/blocked/waiting",
    quickStart: [
      "ส่งขึ้น board เฉพาะงานที่ผ่านการ process จาก GTD แล้ว",
      "เลือก saved view ให้ตรงโจทย์ก่อน เช่น today, waiting_on, overdue",
      "เติม blocker, next action และ due date ให้คนอื่นอ่านต่อได้ทันที",
    ],
    routine: [
      {
        title: "Pick the right view",
        body: "เริ่มจาก Today หรือ This week เพื่อให้เห็นเฉพาะงานที่ต้องตัดสินใจตอนนี้",
      },
      {
        title: "Update status from real work",
        body: "ย้าย card เมื่อสถานะเปลี่ยนจริง ไม่ใช่เพื่อทำให้ board ดูสวย",
      },
      {
        title: "Use intake for new information",
        body: "ถ้ามี minutes, RFI, revision log หรือ site photo ให้เข้า intake แล้วให้ระบบแตกงานต่อ",
      },
    ],
    outputs: [
      "Board ที่เห็น bottleneck และ blocked task ชัด",
      "Review queue สำหรับข้อมูลใหม่ที่ต้องตรวจ",
      "Revision log และ weekly report ของแต่ละโปรเจกต์",
      "AI chat brief สำหรับส่งต่อให้ AI ภายนอก",
    ],
    guardrail:
      "อย่าโยนความคิดดิบหรือ reminder ส่วนตัวขึ้น board เพราะจะทำให้ทีมเห็น noise แทนงานจริง",
    statusNote:
      "Kanban board, review queue, weekly report และ AI brief ใช้งานได้แล้วใน module นี้",
    actions: [
      { label: "Open Kanban board", href: "/todos" },
      { label: "Open GTD workspace", href: "/gtd" },
      { label: "Open AI guide", href: "/ai-assistant" },
    ],
    referenceGroups: [
      {
        title: "เมนูบนหน้า Kanban",
        items: [
          {
            label: "Projects",
            body: "แถบซ้ายใช้เลือกโปรเจกต์ที่กำลังดูอยู่ งาน, report และ review queue ตรงกลางจะเปลี่ยนตามโปรเจกต์นี้ทั้งหมด",
          },
          {
            label: "Saved Views",
            body: "ใช้กรองงานแบบเร็ว เช่น Today, This Week, Waiting On, Overdue, RFIs, Submittals และ Site Issues เพื่อหยิบดูเฉพาะกลุ่มงานที่ต้องตัดสินใจตอนนี้",
          },
          {
            label: "Domain Tabs",
            body: "Tasks คือบอร์ดหลัก, Decisions คือบันทึกคำตัดสินใจ, Revision Log คือประวัติ revision, Weekly Report คือรายงานประจำสัปดาห์, Review Queue คือรายการที่รอตรวจ",
          },
          {
            label: "Intake",
            body: "ใช้เอาข้อมูลใหม่ที่ยังไม่เป็น task เข้าระบบ เช่น minutes, RFI log, revision text, site photo หรือ markup แล้วให้ระบบสร้างรายการรอตรวจต่อ",
          },
          {
            label: "Add Task",
            body: "ใช้สร้าง task ด้วยมือเมื่อรู้อยู่แล้วว่างานคืออะไร ใครทำ และควรขึ้นบอร์ดทันทีโดยไม่ต้องผ่าน intake",
          },
          {
            label: "Copy for AI chat",
            body: "คัดลอกสรุปของโปรเจกต์ปัจจุบันเพื่อเอาไปถาม AI ภายนอกต่อ เช่น ขอให้ช่วยจัดลำดับงานหรือมอง blocker",
          },
        ],
      },
      {
        title: "เมนู Intake ใช้ตอนไหน",
        items: [
          {
            label: "Meeting note intake",
            body: "ใช้หลังประชุม วาง minutes, discussion notes หรือ action items ลงไป ระบบจะสกัดประเด็นแล้วส่งเข้า review queue ก่อนสร้าง task หรือ decision จริง",
          },
          {
            label: "RFI / revision intake",
            body: "ใช้กับข้อความหรือข้อมูลที่มาจาก RFI log, submittal log หรือ drawing revision โดยเลือกชนิด log ให้ตรงก่อน paste ข้อมูลหรือ CSV rows",
          },
          {
            label: "Site photo / markup intake",
            body: "ใช้กับรูปหน้างาน, screenshot, หรือภาพที่มี markup เพื่อให้ระบบเก็บเป็น artifact และช่วยแตก issue หรือ follow-up ต่อจากภาพนั้น",
          },
          {
            label: "After intake",
            body: "ข้อมูลจาก intake จะยังไม่ขึ้นบอร์ดทันที แต่จะไปที่ Review Queue ก่อนเพื่อให้คนตรวจว่าข้อเสนอ task, decision หรือ summary ถูกต้องจริง",
          },
        ],
      },
      {
        title: "Task Type หมายถึงอะไร",
        items: [
          {
            label: "Design",
            body: "งานออกแบบหรือแก้แบบ เช่น layout, detail, drawing pack หรือการพัฒนา solution ด้านสถาปัตย์/วิศวกรรม",
          },
          {
            label: "Coordination",
            body: "งานประสานหลายฝ่าย เช่น clash, ขอข้อมูลจาก consultant, sync กับ supplier หรือเคลียร์จุดเชื่อมต่อระหว่างทีม",
          },
          {
            label: "Approval",
            body: "งานที่เกี่ยวกับการขออนุมัติหรือเตรียมเอกสารเพื่ออนุมัติจาก client, consultant, owner หรือหน่วยงาน",
          },
          {
            label: "RFI",
            body: "คำถามที่ต้องการคำตอบชัดเพื่อให้ทำงานต่อได้ เหมาะกับประเด็นข้อมูลขาด, แบบไม่ชัด, หรือ field query จากหน้างาน",
          },
          {
            label: "Submittal",
            body: "งานส่งวัสดุ, shop drawing, sample หรือเอกสารที่ต้อง review/approve ก่อนผลิตหรือก่อสร้างต่อ",
          },
          {
            label: "Site Issue",
            body: "ปัญหาหน้างานที่ต้องติดตามแก้ เช่น งานผิดแบบ, defect, access problem, safety concern หรือ issue จากรูป site",
          },
          {
            label: "Punch List",
            body: "รายการเก็บงานหรือ defect ที่ต้องปิดให้ครบก่อนส่งมอบ ใช้กับ snag list และงาน correction ที่ตรวจพบแล้ว",
          },
          {
            label: "Procurement",
            body: "งานจัดซื้อหรือจัดหา เช่น ขอราคา, สั่งของ, เช็ก lead time, ตามของเข้า site หรือประสาน supplier",
          },
          {
            label: "Meeting Follow-up",
            body: "งานที่เกิดจากประชุมโดยตรง เช่น ส่ง recap, ตาม owner, ปิด commitment หรือแตก next step หลังจบประชุม",
          },
        ],
      },
    ],
  },
  {
    slug: "lean",
    name: "Lean",
    role: "ระบบวิเคราะห์ flow และลด waste หลังจบ phase หรือเมื่อเริ่มติดคอขวด",
    status: "planned",
    pageHref: "/lean",
    overview:
      "Lean ใช้หลังจากงานวิ่งไประยะหนึ่งแล้ว เพื่อดู handoff, rework, waiting, และ waste ที่เกิดใน process จากนั้นเลือก kaizen ที่เล็กแต่มีผลจริง",
    whenToUse:
      "ใช้ตอนจบ phase, retrospective รายเดือน, หรือเมื่อเห็นว่าทีมเริ่มเสียเวลาไปกับงานรอและงานแก้ซ้ำ",
    cadence:
      "สัปดาห์ละ 1 ครั้งสำหรับ retrospective สั้น หรือจบแต่ละ phase สำหรับ VSM เต็มรูปแบบ",
    quickStart: [
      "เลือก flow เดียวก่อน เช่น revision cycle หรือ approval loop",
      "เขียนขั้นตอน handoff และเวลารอที่เกิดจริง",
      "เลือก waste สำคัญ 1 จุดแล้วทดลอง kaizen 1 อย่างก่อน",
    ],
    routine: [
      {
        title: "Map the current flow",
        body: "บันทึกว่า request เข้าอย่างไร, ส่งต่อที่ใคร, และค้างรอตรงไหนบ้าง",
      },
      {
        title: "Name the waste",
        body: "แยกให้ชัดว่าเป็น waiting, rework, overprocessing, motion หรือ information loss",
      },
      {
        title: "Close with one experiment",
        body: "ทุก retrospective ควรจบด้วย action item เดียวที่วัดผลได้จริงในรอบถัดไป",
      },
    ],
    outputs: [
      "Value stream map ของ flow ที่มีปัญหา",
      "Waste list พร้อมลำดับความสำคัญ",
      "Kaizen experiment และ owner ที่รับผิดชอบ",
      "Retrospective note ที่ส่งต่อให้ทีมได้",
    ],
    guardrail:
      "Lean ไม่ใช่งานทำตลอดวัน ให้ใช้เป็นช่วงวิเคราะห์สั้น ๆ แล้วกลับไปปรับ flow จริงในระบบหลัก",
    statusNote:
      "Module Lean ยังไม่ถูกสร้างเป็น workspace เต็ม แต่คู่มือและ workflow พื้นฐานพร้อมใช้เป็นแนวทางแล้ว",
    actions: [
      { label: "Open Kanban board", href: "/todos" },
      { label: "Settings & Export", href: "/settings" },
      { label: "Back to Manual", href: "/aec-workflow" },
    ],
  },
  {
    slug: "cpm",
    name: "CPM",
    role: "ระบบวาง milestone, dependency และ lookahead planning สำหรับงานก่อสร้าง",
    status: "planned",
    pageHref: "/cpm",
    overview:
      "CPM ใช้ช่วง CA และ construction เพื่อวาง sequence ของงาน, constraint, RFI, submittal และกิจกรรมที่กระทบ critical path",
    whenToUse:
      "ใช้เมื่อโปรเจกต์เข้า phase ก่อสร้าง, ต้องทำ lookahead, หรือมี dependency หลายฝ่ายที่กระทบ timeline",
    cadence:
      "review รายสัปดาห์สำหรับ lookahead และทุกครั้งที่ milestone หรือ dependency เปลี่ยน",
    quickStart: [
      "ระบุ milestone หลักให้ครบก่อน เช่น submit, approve, fabricate, install",
      "เชื่อม dependency ที่กระทบ critical path ให้เห็นชัด",
      "เช็ก constraint, RFI, submittal และ owner ของแต่ละรายการทุกสัปดาห์",
    ],
    routine: [
      {
        title: "Plan from milestones backward",
        body: "เริ่มจากวันที่ต้องส่งมอบ แล้วแตก activity ย้อนกลับพร้อม dependency สำคัญ",
      },
      {
        title: "Run a weekly lookahead",
        body: "ดูงาน 2-6 สัปดาห์ข้างหน้าและเคลียร์ constraint ที่จะทำให้งานเริ่มไม่ได้",
      },
      {
        title: "Track execution signals",
        body: "อัปเดต RFI, submittal, drawing revision และ site issues ให้สะท้อนแผนปัจจุบัน",
      },
    ],
    outputs: [
      "Milestone plan และ lookahead list",
      "Dependency map ของงานสำคัญ",
      "Constraint log สำหรับงานที่ยังเริ่มไม่ได้",
      "RFI/submittal/revision tracker ที่โยงกับ timeline",
    ],
    guardrail:
      "อย่าเริ่มจาก gantt ที่ละเอียดเกินจริง ถ้า milestone กับ dependency ยังไม่ชัด plan จะพังเร็วมาก",
    statusNote:
      "CPM module ยังเป็น planned แต่ tracker ปัจจุบันช่วยเก็บ RFI, revision log และ weekly report ได้บางส่วนแล้ว",
    actions: [
      { label: "Open Kanban board", href: "/todos" },
      { label: "Open Lean guide", href: "/lean" },
      { label: "Back to Manual", href: "/aec-workflow" },
    ],
  },
  {
    slug: "ai-assistant",
    name: "AI Assistant",
    role: "ระบบช่วยสรุปและวิเคราะห์ผ่าน workflow แบบ copy/export ไปถาม AI ภายนอก",
    status: "partial",
    pageHref: "/ai-assistant",
    overview:
      "AI Assistant ใน workflow นี้ไม่ได้ต่อ API อัตโนมัติ แต่ให้คุณคัดลอก weekly brief, project brief หรือ export data ออกไปถาม AI ภายนอก แล้วค่อยนำคำตอบกลับมาใช้ตัดสินใจเอง",
    whenToUse:
      "ใช้ตอน weekly review, project review, หรือเมื่ออยากให้ AI ช่วยจัดลำดับความสำคัญและมองความเสี่ยง",
    cadence:
      "สัปดาห์ละ 1-2 ครั้ง หรือเฉพาะตอนต้องการ synthesis ของข้อมูลจำนวนมาก",
    quickStart: [
      "จาก GTD กด Copy brief เพื่อสรุป weekly review",
      "จาก Kanban กด Copy for AI chat เพื่อสรุปสถานะโปรเจกต์",
      "ถ้าต้องการข้อมูลละเอียดให้ export CSV/JSON จาก Settings แล้วแนบไปถาม AI ภายนอก",
    ],
    routine: [
      {
        title: "Ask a focused question",
        body: "ถามให้แคบ เช่น งานไหน overdue, waiting ไหน stale, หรือ next action ไหนควรหยิบก่อน",
      },
      {
        title: "Review before applying",
        body: "ทุกคำตอบจาก AI ต้องถูกตรวจและแปลงเป็นการอัปเดตใน GTD หรือ Kanban ด้วยมือ",
      },
      {
        title: "Keep exports lightweight",
        body: "เริ่มจาก copy brief ก่อน ถ้าไม่พอค่อย export JSON/CSV เพื่อกันข้อมูลล้น context",
      },
    ],
    outputs: [
      "Priority summary สำหรับสัปดาห์นี้",
      "Risk list และ bottleneck ที่ควรจับตา",
      "Suggested next actions สำหรับ GTD และ Kanban",
      "Meeting/review summary ที่เอาไปใช้ต่อได้",
    ],
    guardrail:
      "AI ไม่มีสิทธิ์แก้ข้อมูลในระบบแทนคุณ คำตอบทุกชิ้นต้องผ่านการ review ก่อนอัปเดตจริง",
    statusNote:
      "ตอนนี้ workflow แบบ copy brief และ export พร้อมใช้ แต่ยังไม่มี API integration หรือ auto-write back",
    actions: [
      { label: "Open GTD workspace", href: "/gtd" },
      { label: "Open Kanban board", href: "/todos" },
      { label: "Settings & Export", href: "/settings" },
    ],
  },
];

export function getManualSystemGuide(slug: ManualSystemSlug) {
  return manualSystemGuides.find((guide) => guide.slug === slug);
}
