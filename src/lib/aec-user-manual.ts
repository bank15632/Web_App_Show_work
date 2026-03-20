export interface ManualFrameworkCard {
  name: string;
  role: string;
  whenToUse: string;
  status: "available" | "partial" | "planned";
  href?: string;
  actionLabel?: string;
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

export const manualFrameworkCards: ManualFrameworkCard[] = [
  {
    name: "GTD",
    role: "จัดการงานส่วนตัว",
    whenToUse: "ทุกวัน: capture, process, review",
    status: "available",
    href: "/gtd",
    actionLabel: "Open GTD workspace",
  },
  {
    name: "Kanban",
    role: "จัดการทีม + โปรเจกต์",
    whenToUse: "ทุกวัน: ดูสถานะงาน, ย้าย cards, จำกัด WIP",
    status: "available",
    href: "/todos",
    actionLabel: "Open Kanban board",
  },
  {
    name: "Lean",
    role: "วิเคราะห์ + ลด waste",
    whenToUse: "จบทุก phase: VSM, retrospective, kaizen",
    status: "planned",
  },
  {
    name: "CPM",
    role: "วางแผนก่อสร้าง",
    whenToUse: "CA phase: Gantt chart, RFI, Last Planner",
    status: "planned",
  },
  {
    name: "AI Assistant",
    role: "วิเคราะห์ + แนะนำ",
    whenToUse: "ทุกสัปดาห์: สรุป, พยากรณ์, แนะนำ next action",
    status: "partial",
    href: "/todos",
    actionLabel: "Use AI brief",
  },
];

export const manualDashboardPanels: ManualDashboardPanel[] = [
  {
    title: "GTD Stats",
    body: "จำนวน inbox, next actions, waiting for และ freshness ของ weekly review",
  },
  {
    title: "Kanban Overview",
    body: "สถานะรวมทุกโปรเจกต์, bottleneck indicator และงานที่ยังติดค้าง",
  },
  {
    title: "Upcoming",
    body: "calendar items, overdue tasks และ deadline ที่กำลังจะถึง",
  },
  {
    title: "AI Insights",
    body: "สรุปสั้น ๆ ว่าสัปดาห์นี้ควรโฟกัสอะไรและงานไหนควรหยิบก่อน",
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
