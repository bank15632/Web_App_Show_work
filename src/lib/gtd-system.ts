export type GtdBucket =
  | "inbox"
  | "next"
  | "projects"
  | "waiting"
  | "calendar"
  | "someday"
  | "reference";

export type GtdContext =
  | ""
  | "computer"
  | "phone"
  | "site"
  | "office"
  | "errands"
  | "home";

export type GtdPriority = "high" | "medium" | "low";

export interface GtdItem {
  id: string;
  text: string;
  bucket: GtdBucket;
  context: GtdContext;
  priority: GtdPriority;
  dueDate: string | null;
  note: string;
  done: boolean;
  doneAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyReviewState {
  steps: Record<string, boolean>;
  focus: string;
  notes: string;
  lastCompletedAt: string | null;
}

export interface WeeklyReviewStatus {
  tone: "good" | "warning" | "danger";
  title: string;
  body: string;
  action: string;
  daysSince: number | null;
}

export interface GtdWorkspaceData {
  items: GtdItem[];
  review: WeeklyReviewState;
}

export interface GtdItemMutationInput {
  text: string;
  bucket?: GtdBucket;
  context?: GtdContext;
  priority?: GtdPriority;
  dueDate?: string | null;
  note?: string;
  done?: boolean;
  doneAt?: string | null;
}

export interface GtdReviewMutationInput {
  steps?: Record<string, boolean>;
  focus?: string;
  notes?: string;
  lastCompletedAt?: string | null;
  reset?: boolean;
}

export const gtdStorageKey = "bnj:gtd-workspace:v1";
export const reviewStorageKey = "bnj:gtd-weekly-review:v1";

export const bucketOrder: GtdBucket[] = [
  "inbox",
  "next",
  "projects",
  "waiting",
  "calendar",
  "someday",
  "reference",
];

export const bucketLabels: Record<GtdBucket, string> = {
  inbox: "Inbox",
  next: "Next Actions",
  projects: "Projects",
  waiting: "Waiting For",
  calendar: "Calendar",
  someday: "Someday",
  reference: "Reference",
};

export const contextOptions: Array<{ value: GtdContext | "all"; label: string }> = [
  { value: "all", label: "All contexts" },
  { value: "computer", label: "@computer" },
  { value: "phone", label: "@phone" },
  { value: "site", label: "@site" },
  { value: "office", label: "@office" },
  { value: "errands", label: "@errands" },
  { value: "home", label: "@home" },
];

export const reviewSteps = [
  {
    id: "clear-inbox",
    title: "Clear the inbox",
    body: "จัด bucket ให้ทุก item ที่ยังค้างอยู่",
  },
  {
    id: "review-next",
    title: "Review next actions",
    body: "เช็กว่างานที่หยิบทำได้จริงยังชัดอยู่",
  },
  {
    id: "review-waiting",
    title: "Review waiting for",
    body: "ตามงานที่ค้างกับลูกค้า ทีม หรือ consultant",
  },
  {
    id: "review-calendar",
    title: "Review calendar",
    body: "เช็ก due date และ commitment ที่กำลังจะถึง",
  },
  {
    id: "review-projects",
    title: "Review projects",
    body: "ทุก project ควรมี next action อย่างน้อยหนึ่งอย่าง",
  },
  {
    id: "set-focus",
    title: "Set weekly focus",
    body: "เลือก focus หลักของสัปดาห์นี้ให้ชัด",
  },
] as const;

export const gtdSeedItems: GtdItem[] = [
  createSeededItem(
    "gtd_seed_1",
    "สรุป feedback ลูกค้า Nordic Home Office หลัง review ล่าสุด",
    "inbox",
    "computer",
    "high",
    null,
    "",
    "2026-03-20T08:00:00.000Z",
  ),
  createSeededItem(
    "gtd_seed_2",
    "โทรตาม consultant เรื่อง revised MEP markups",
    "next",
    "phone",
    "high",
    null,
    "ถาม timeline ที่ confirm ได้จริงก่อนนัด client รอบถัดไป",
    "2026-03-19T09:30:00.000Z",
  ),
  createSeededItem(
    "gtd_seed_3",
    "รอผู้รับเหมาส่งราคา built-in ห้องนั่งเล่น",
    "waiting",
    "",
    "medium",
    "2026-03-24",
    "ถ้าเกินอังคารให้ follow up ทันที",
    "2026-03-18T04:15:00.000Z",
  ),
  createSeededItem(
    "gtd_seed_4",
    "เตรียม weekly review สำหรับทีม design",
    "calendar",
    "office",
    "medium",
    "2026-03-21",
    "รวบรวม blockers และงานที่ยังไม่มี next action",
    "2026-03-20T02:00:00.000Z",
  ),
  createSeededItem(
    "gtd_seed_5",
    "แตก template A3 report สำหรับ phase lean analytics",
    "someday",
    "computer",
    "low",
    null,
    "รอ phase 3 ก่อนค่อยหยิบขึ้นมา",
    "2026-03-17T07:45:00.000Z",
  ),
];

export function createDefaultReviewState(): WeeklyReviewState {
  return {
    steps: Object.fromEntries(reviewSteps.map((step) => [step.id, false])),
    focus: "",
    notes: "",
    lastCompletedAt: null,
  };
}

export function safeParseItems(
  value: string | null,
  fallback: GtdItem[] = [],
): GtdItem[] {
  if (!value) return fallback;

  try {
    const parsed = JSON.parse(value) as GtdItem[];
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function safeParseReview(value: string | null): WeeklyReviewState {
  if (!value) return createDefaultReviewState();

  try {
    const parsed = JSON.parse(value) as WeeklyReviewState;
    return {
      ...createDefaultReviewState(),
      ...parsed,
      steps: {
        ...createDefaultReviewState().steps,
        ...(parsed.steps ?? {}),
      },
    };
  } catch {
    return createDefaultReviewState();
  }
}

export function getBucketCounts(items: GtdItem[]) {
  return bucketOrder.reduce(
    (acc, bucket) => {
      acc[bucket] = items.filter((item) => item.bucket === bucket && !item.done).length;
      return acc;
    },
    {} as Record<GtdBucket, number>,
  );
}

export function getWeeklyReviewStatus(
  lastCompletedAt: string | null,
  referenceTime = Date.now(),
): WeeklyReviewStatus {
  if (!lastCompletedAt) {
    return {
      tone: "warning",
      title: "ยังไม่เคยทำ Weekly Review",
      body: "คู่มือแนะนำให้ทำ review ทุก 7 วันเพื่อกัน inbox ค้างและให้ dashboard สรุป focus ได้ตรงขึ้น",
      action: "เริ่มจาก clear inbox แล้วตั้ง weekly focus ครั้งแรก",
      daysSince: null,
    };
  }

  const elapsedDays = Math.max(
    0,
    Math.floor((referenceTime - new Date(lastCompletedAt).getTime()) / 86400000),
  );

  if (elapsedDays >= 21) {
    return {
      tone: "danger",
      title: "ขาด Weekly Review เกิน 3 สัปดาห์",
      body: "คู่มือแนะนำให้ทำ Brain Dump ใหม่ เขียนทุกอย่างที่ค้างลง inbox แล้ว process ใหม่ทั้งหมด",
      action: "จองเวลา 30-60 นาทีวันนี้เพื่อ reset ระบบงาน",
      daysSince: elapsedDays,
    };
  }

  if (elapsedDays >= 10) {
    return {
      tone: "danger",
      title: "Weekly Review ค้างเกิน 10 วัน",
      body: "ตามคู่มือ dashboard ควรขึ้นเตือนระดับแดงเมื่อ review หลุดเกิน 10 วัน เพราะความเสี่ยงงานตกหล่นเริ่มสูง",
      action: "ทำ Weekly Review ภายในวันนี้และไล่ waiting for ที่ค้างทั้งหมด",
      daysSince: elapsedDays,
    };
  }

  if (elapsedDays >= 7) {
    return {
      tone: "warning",
      title: "ถึงรอบ Weekly Review",
      body: "คู่มือกำหนดให้ระบบเตือนทุก 7 วันเพื่อรีเฟรช next actions, calendar และ weekly focus",
      action: "กันเวลา 30-60 นาทีภายในวันนี้หรือพรุ่งนี้",
      daysSince: elapsedDays,
    };
  }

  return {
    tone: "good",
    title: "Weekly Review ยังสดอยู่",
    body: "สถานะตอนนี้ยังอยู่ในช่วงที่ระบบควรใช้งานได้ลื่น สามารถโฟกัส deep work ต่อได้",
    action: "รักษา WIP ให้ต่ำและ process inbox ทุกเย็น",
    daysSince: elapsedDays,
  };
}

function createSeededItem(
  id: string,
  text: string,
  bucket: GtdBucket,
  context: GtdContext,
  priority: GtdPriority,
  dueDate: string | null,
  note: string,
  timestamp: string,
): GtdItem {
  return {
    id,
    text,
    bucket,
    context,
    priority,
    dueDate,
    note,
    done: false,
    doneAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
