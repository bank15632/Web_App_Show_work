"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpenText,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  FolderOpen,
  FolderKanban,
  Layers3,
  ListChecks,
  ListTodo,
  Settings2,
} from "lucide-react";

import { type ClientRoomProjectSummary } from "@/lib/client-rooms/types";
import { fetchGtdWorkspace } from "@/lib/gtd/client";
import {
  bucketLabels,
  bucketOrder,
  getWeeklyReviewStatus,
  type GtdItem,
} from "@/lib/gtd-system";
import { formatPortalDate } from "@/lib/portal-data";
import { taskStatusLabels } from "@/lib/tracker/constants";
import type { TrackerTaskRecord, TrackerWorkspaceData } from "@/lib/tracker/types";
import { cn } from "@/lib/utils";

const DAY_MS = 86_400_000;

type SourceStateTone = "loading" | "ready" | "error";
type DashboardTaskSystem = "GTD" | "Kanban";
type DeadlineTone = "overdue" | "today" | "soon";
type ClientRoomStatus = "draft" | "dirty" | "live";

type SourceState = {
  tone: SourceStateTone;
  message: string;
};

type TrackerTaskWithProject = TrackerTaskRecord & {
  projectName: string;
  projectType: string;
};

type DistributionItem = {
  label: string;
  value: number;
  colorClassName: string;
  hint?: string;
};

type TrendPoint = {
  label: string;
  fullLabel: string;
  gtd: number;
  kanban: number;
  total: number;
};

type DailySeriesPoint = {
  label: string;
  fullLabel: string;
  value: number;
};

type AttentionItem = {
  id: string;
  system: DashboardTaskSystem;
  title: string;
  context: string;
  dueDate: string;
  dueLabel: string;
  tone: DeadlineTone;
  href: string;
};

const deadlineToneClassNames: Record<DeadlineTone, string> = {
  overdue: "border-rose-200 bg-rose-50 text-rose-700",
  today: "border-amber-200 bg-amber-50 text-amber-700",
  soon: "border-sky-200 bg-sky-50 text-sky-700",
};

const bucketColorClassNames: Record<string, string> = {
  inbox: "bg-zinc-900",
  next: "bg-zinc-700",
  projects: "bg-zinc-600",
  waiting: "bg-amber-400",
  calendar: "bg-sky-400",
  someday: "bg-stone-400",
  reference: "bg-emerald-400",
};

const kanbanStatusColorClassNames: Record<string, string> = {
  todo: "bg-zinc-800",
  doing: "bg-sky-500",
  waiting: "bg-amber-400",
  blocked: "bg-rose-500",
  done: "bg-emerald-500",
};

function useScrollAnimation() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
    );

    const observeFadeUpElement = (element: Element) => {
      if (!(element instanceof HTMLElement)) return;
      if (!element.classList.contains("fade-up")) return;
      observer.observe(element);
    };

    const observeTree = (root: ParentNode) => {
      root.querySelectorAll(".fade-up").forEach(observeFadeUpElement);
      if (root instanceof HTMLElement && root.classList.contains("fade-up")) {
        observeFadeUpElement(root);
      }
    };

    observeTree(container);

    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          observeTree(node);
        });
      });
    });

    mutationObserver.observe(container, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      observer.disconnect();
    };
  }, []);

  return ref;
}

export function DashboardView() {
  const containerRef = useScrollAnimation();

  const [gtdItems, setGtdItems] = useState<GtdItem[]>([]);
  const [trackerWorkspace, setTrackerWorkspace] = useState<TrackerWorkspaceData | null>(null);
  const [clientRoomProjects, setClientRoomProjects] = useState<ClientRoomProjectSummary[]>([]);
  const [gtdState, setGtdState] = useState<SourceState>({
    tone: "loading",
    message: "กำลังดึงข้อมูล GTD workspace...",
  });
  const [trackerState, setTrackerState] = useState<SourceState>({
    tone: "loading",
    message: "กำลังดึงข้อมูล Kanban board...",
  });
  const [clientRoomState, setClientRoomState] = useState<SourceState>({
    tone: "loading",
    message: "กำลังดึงข้อมูล Client Rooms...",
  });
  const [reviewStatus, setReviewStatus] = useState(getWeeklyReviewStatus(null));
  const [referenceTime, setReferenceTime] = useState(() => Date.now());

  useEffect(() => {
    let ignore = false;

    async function loadWorkspace() {
      setGtdState({ tone: "loading", message: "กำลังดึงข้อมูล GTD workspace..." });
      setTrackerState({ tone: "loading", message: "กำลังดึงข้อมูล Kanban board..." });
      setClientRoomState({ tone: "loading", message: "กำลังดึงข้อมูล Client Rooms..." });

      const [gtdResult, trackerResult, clientRoomResult] = await Promise.allSettled([
        fetchGtdWorkspace(),
        getTrackerWorkspace(),
        getClientRoomProjects(),
      ]);

      if (ignore) return;

      if (gtdResult.status === "fulfilled") {
        setGtdItems(gtdResult.value.items);
        setReviewStatus(getWeeklyReviewStatus(gtdResult.value.review.lastCompletedAt));
        setGtdState({
          tone: "ready",
          message: "GTD workspace พร้อมใช้งาน",
        });
      } else {
        setGtdItems([]);
        setReviewStatus(getWeeklyReviewStatus(null));
        setGtdState({
          tone: "error",
          message:
            gtdResult.reason instanceof Error
              ? gtdResult.reason.message
              : "GTD workspace unavailable.",
        });
      }

      if (trackerResult.status === "fulfilled") {
        setTrackerWorkspace(trackerResult.value);
        setTrackerState({
          tone: "ready",
          message: "Kanban board พร้อมใช้งาน",
        });
      } else {
        setTrackerWorkspace(null);
        setTrackerState({
          tone: "error",
          message:
            trackerResult.reason instanceof Error
              ? trackerResult.reason.message
              : "Kanban board unavailable.",
        });
      }

      if (clientRoomResult.status === "fulfilled") {
        setClientRoomProjects(clientRoomResult.value);
        setClientRoomState({
          tone: "ready",
          message:
            clientRoomResult.value.length > 0
              ? "Client Rooms พร้อมใช้งาน"
              : "ยังไม่มี Client Room ในระบบ",
        });
      } else {
        setClientRoomProjects([]);
        setClientRoomState({
          tone: "error",
          message:
            clientRoomResult.reason instanceof Error
              ? clientRoomResult.reason.message
              : "Client Rooms unavailable.",
        });
      }

      setReferenceTime(Date.now());
    }

    void loadWorkspace();

    const handleWindowFocus = () => {
      void loadWorkspace();
    };

    window.addEventListener("focus", handleWindowFocus);

    return () => {
      ignore = true;
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, []);

  const todayStart = useMemo(() => getDayStart(referenceTime), [referenceTime]);
  const sevenDayWindowEnd = todayStart + DAY_MS * 7;
  const trackerProjects = useMemo(
    () => trackerWorkspace?.projects ?? [],
    [trackerWorkspace],
  );

  const trackerTasks = useMemo<TrackerTaskWithProject[]>(
    () =>
      trackerProjects.flatMap((project) =>
        project.tasks.map((task) => ({
          ...task,
          projectName: project.name,
          projectType: project.projectType.trim() || "General",
        })),
      ),
    [trackerProjects],
  );

  const trackerProjectTypeById = useMemo(
    () =>
      new Map(
        trackerProjects.map((project) => [
          project.id,
          project.projectType.trim() || "General",
        ]),
      ),
    [trackerProjects],
  );
  const clientRoomGroups = useMemo(() => {
    const groups: Record<ClientRoomStatus, ClientRoomProjectSummary[]> = {
      draft: [],
      dirty: [],
      live: [],
    };

    for (const project of clientRoomProjects) {
      groups[getClientRoomStatus(project)].push(project);
    }

    return groups;
  }, [clientRoomProjects]);

  const openGtdItems = useMemo(
    () => gtdItems.filter((item) => !item.done),
    [gtdItems],
  );
  const openTrackerTasks = useMemo(
    () => trackerTasks.filter((task) => task.status !== "done"),
    [trackerTasks],
  );

  const openGtdCount = openGtdItems.length;
  const openTrackerCount = openTrackerTasks.length;
  const combinedOpenCount = openGtdCount + openTrackerCount;
  const activeClientRooms = clientRoomProjects.length;
  const clientRoomDocumentCount = clientRoomProjects.reduce(
    (count, project) => count + project.documentCount,
    0,
  );
  const clientRoomPendingPublishes = clientRoomProjects.filter(
    (project) => getClientRoomStatus(project) !== "live",
  ).length;
  const recentClientRooms = useMemo(
    () =>
      [...clientRoomProjects]
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        )
        .slice(0, 4),
    [clientRoomProjects],
  );
  const clientRoomStatusSegments = useMemo<DistributionItem[]>(
    () => [
      {
        label: "Draft",
        value: clientRoomGroups.draft.length,
        colorClassName: "bg-amber-400",
      },
      {
        label: "Unpublished Changes",
        value: clientRoomGroups.dirty.length,
        colorClassName: "bg-sky-400",
      },
      {
        label: "Live",
        value: clientRoomGroups.live.length,
        colorClassName: "bg-emerald-500",
      },
    ],
    [clientRoomGroups],
  );

  const blockedTaskCount = openTrackerTasks.filter((task) => task.status === "blocked").length;
  const waitingTaskCount = openTrackerTasks.filter((task) => task.status === "waiting").length;
  const staleWaitingCount = openGtdItems.filter(
    (item) =>
      item.bucket === "waiting" &&
      referenceTime - new Date(item.updatedAt).getTime() > DAY_MS * 5,
  ).length;
  const openReviewCount =
    trackerWorkspace?.reviewItems.filter((item) => item.status === "pending").length ?? 0;

  const gtdOverdueCount = openGtdItems.filter((item) => isOverdue(item.dueDate, todayStart)).length;
  const gtdDueTodayCount = openGtdItems.filter((item) => isDueToday(item.dueDate, todayStart)).length;
  const gtdDueSoonCount = openGtdItems.filter((item) =>
    isDueBetween(item.dueDate, todayStart + DAY_MS, sevenDayWindowEnd),
  ).length;
  const gtdNoDeadlineCount = openGtdItems.filter((item) => !item.dueDate).length;

  const trackerOverdueCount = openTrackerTasks.filter((task) =>
    isOverdue(task.dueDate, todayStart),
  ).length;
  const trackerDueTodayCount = openTrackerTasks.filter((task) =>
    isDueToday(task.dueDate, todayStart),
  ).length;
  const trackerDueSoonCount = openTrackerTasks.filter((task) =>
    isDueBetween(task.dueDate, todayStart + DAY_MS, sevenDayWindowEnd),
  ).length;
  const trackerNoDeadlineCount = openTrackerTasks.filter((task) => !task.dueDate).length;

  const combinedOverdueCount = gtdOverdueCount + trackerOverdueCount;
  const combinedDueTodayCount = gtdDueTodayCount + trackerDueTodayCount;
  const combinedDueSoonCount = gtdDueSoonCount + trackerDueSoonCount;
  const combinedNoDeadlineCount = gtdNoDeadlineCount + trackerNoDeadlineCount;

  const gtdCounts = useMemo(() => {
    return bucketOrder.map((bucket) => ({
      label: bucketLabels[bucket],
      value: openGtdItems.filter((item) => item.bucket === bucket).length,
      colorClassName: bucketColorClassNames[bucket],
      hint: bucket === "waiting" ? "ติดตามงานค้าง" : undefined,
    }));
  }, [openGtdItems]);

  const kanbanStatusCounts = useMemo<DistributionItem[]>(
    () =>
      (["todo", "doing", "waiting", "blocked", "done"] as const).map((status) => ({
        label: taskStatusLabels[status],
        value: trackerTasks.filter((task) => task.status === status).length,
        colorClassName: kanbanStatusColorClassNames[status],
        hint:
          status === "blocked"
            ? "ติด blocker"
            : status === "waiting"
              ? "รอ input หรือ approval"
              : undefined,
      })),
    [trackerTasks],
  );

  const deadlineSegments = useMemo<DistributionItem[]>(
    () => [
      {
        label: "Overdue",
        value: combinedOverdueCount,
        colorClassName: "bg-rose-500",
      },
      {
        label: "Due today",
        value: combinedDueTodayCount,
        colorClassName: "bg-amber-400",
      },
      {
        label: "Next 7 days",
        value: combinedDueSoonCount,
        colorClassName: "bg-sky-400",
      },
      {
        label: "No deadline",
        value: combinedNoDeadlineCount,
        colorClassName: "bg-stone-300",
      },
    ],
    [
      combinedDueSoonCount,
      combinedDueTodayCount,
      combinedNoDeadlineCount,
      combinedOverdueCount,
    ],
  );

  const workloadSegments = useMemo<DistributionItem[]>(
    () => [
      {
        label: "GTD",
        value: openGtdCount,
        colorClassName: "bg-zinc-900",
      },
      {
        label: "Kanban",
        value: openTrackerCount,
        colorClassName: "bg-zinc-400",
      },
    ],
    [openGtdCount, openTrackerCount],
  );

  const projectMix = useMemo<DistributionItem[]>(() => {
    const counts = new Map<string, number>();

    for (const task of openTrackerTasks) {
      counts.set(task.projectType, (counts.get(task.projectType) ?? 0) + 1);
    }

    for (const item of openGtdItems) {
      const label = item.linkedProjectId
        ? trackerProjectTypeById.get(item.linkedProjectId) ?? "Personal / Misc"
        : "Personal / Misc";
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value], index) => ({
        label,
        value,
        colorClassName:
          index === 0
            ? "bg-zinc-900"
            : index === 1
              ? "bg-zinc-700"
              : index === 2
                ? "bg-sky-400"
                : index === 3
                  ? "bg-amber-400"
                  : "bg-stone-400",
      }));
  }, [openGtdItems, openTrackerTasks, trackerProjectTypeById]);

  const completionTrend = useMemo<TrendPoint[]>(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const dayStart = todayStart - DAY_MS * (6 - index);
      const nextDay = dayStart + DAY_MS;

      const gtd = gtdItems.filter((item) =>
        isTimestampInRange(item.doneAt, dayStart, nextDay),
      ).length;
      const kanban = trackerTasks.filter((task) =>
        isTimestampInRange(task.completedAt, dayStart, nextDay),
      ).length;

      return {
        label: formatShortDay(dayStart),
        fullLabel: formatDateLabel(dayStart),
        gtd,
        kanban,
        total: gtd + kanban,
      };
    });
  }, [gtdItems, todayStart, trackerTasks]);
  const gtdCompletionTrend = useMemo<DailySeriesPoint[]>(
    () =>
      completionTrend.map((point) => ({
        label: point.label,
        fullLabel: point.fullLabel,
        value: point.gtd,
      })),
    [completionTrend],
  );
  const kanbanCompletionTrend = useMemo<DailySeriesPoint[]>(
    () =>
      completionTrend.map((point) => ({
        label: point.label,
        fullLabel: point.fullLabel,
        value: point.kanban,
      })),
    [completionTrend],
  );

  const riskItems = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];

    for (const item of openGtdItems) {
      const tone = getDeadlineTone(item.dueDate, todayStart, sevenDayWindowEnd);
      if (!tone) continue;

      items.push({
        id: item.id,
        system: "GTD",
        title: item.text,
        context: bucketLabels[item.bucket],
        dueDate: item.dueDate ?? "",
        dueLabel: tone === "overdue" ? "เลย deadline" : tone === "today" ? "ครบกำหนดวันนี้" : "กำลังจะถึง",
        tone,
        href: "/gtd",
      });
    }

    for (const task of openTrackerTasks) {
      const tone = getDeadlineTone(task.dueDate, todayStart, sevenDayWindowEnd);
      if (!tone) continue;

      items.push({
        id: task.id,
        system: "Kanban",
        title: task.title,
        context: `${task.projectName} · ${taskStatusLabels[task.status]}`,
        dueDate: task.dueDate ?? "",
        dueLabel: tone === "overdue" ? "เลย deadline" : tone === "today" ? "ครบกำหนดวันนี้" : "กำลังจะถึง",
        tone,
        href: "/todos",
      });
    }

    return items
      .sort((a, b) => compareAttentionItems(a, b))
      .slice(0, 8);
  }, [openGtdItems, openTrackerTasks, sevenDayWindowEnd, todayStart]);

  const sourceStatuses = [
    { label: "GTD", state: gtdState },
    { label: "Kanban", state: trackerState },
    { label: "Client Rooms", state: clientRoomState },
  ];

  const lastSyncLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("th-TH", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(referenceTime),
    [referenceTime],
  );

  const focusHeadline = useMemo(() => {
    if (combinedOverdueCount > 0) {
      return `เคลียร์ ${combinedOverdueCount} งานที่เลย deadline ก่อน`;
    }

    if (combinedDueTodayCount > 0) {
      return `มี ${combinedDueTodayCount} งานที่ต้องปิดภายในวันนี้`;
    }

    if (blockedTaskCount + staleWaitingCount > 0) {
      return `ตาม ${blockedTaskCount + staleWaitingCount} งานที่ติด blocker หรือรอการ follow-up`;
    }

    return "ภาพรวมงานยังนิ่ง สามารถกลับไปโฟกัส deep work ได้";
  }, [blockedTaskCount, combinedDueTodayCount, combinedOverdueCount, staleWaitingCount]);

  const focusBody = useMemo(() => {
    if (combinedOverdueCount > 0) {
      return "เริ่มจากรายการ overdue ก่อน แล้วค่อยจัดลำดับงานที่ครบกำหนดวันนี้และภายใน 7 วัน";
    }

    if (combinedDueTodayCount > 0) {
      return "งานที่ครบกำหนดวันนี้ควรถูกดึงขึ้นมาปิดก่อนงานที่ยังไม่มี deadline ชัด";
    }

    if (blockedTaskCount + staleWaitingCount > 0) {
      return "ลดงานค้างที่รอคนอื่นหรือรอข้อมูล จะช่วยให้ flow ของ GTD และ Kanban สะอาดขึ้นเร็วที่สุด";
    }

    return "ตอนนี้ workload ค่อนข้างสมดุล ใช้ dashboard เป็นจุดเช็กสั้น ๆ แล้วกลับไปลงมือทำงานจริง";
  }, [blockedTaskCount, combinedDueTodayCount, combinedOverdueCount, staleWaitingCount]);

  const gtdCompletionTotal = gtdCompletionTrend.reduce((sum, point) => sum + point.value, 0);
  const kanbanCompletionTotal = kanbanCompletionTrend.reduce((sum, point) => sum + point.value, 0);
  const reviewToneClassName = cn(
    "rounded-full border px-3 py-2 text-sm font-medium",
    reviewStatus.tone === "good" && "border-emerald-200 bg-emerald-50 text-emerald-700",
    reviewStatus.tone === "warning" && "border-amber-200 bg-amber-50 text-amber-700",
    reviewStatus.tone === "danger" && "border-rose-200 bg-rose-50 text-rose-700",
  );

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#fbf7f1_42%,#ffffff_100%)]"
    >
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-[10px]">
        <div className="flex flex-col gap-3 px-4 py-3.5 sm:px-6 lg:flex-row lg:items-center lg:gap-5 lg:px-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-bnj.svg"
            alt="BNJ Studio"
            width={120}
            height={60}
            className="h-7 w-auto shrink-0 sm:h-8"
          />
          <div className="min-w-0 lg:mr-auto">
            <p className="font-display text-[0.98rem] font-semibold tracking-tight sm:text-[1.08rem]">
              AEC Workflow Platform
            </p>
            <p className="mt-0.5 text-[0.92rem] text-muted-foreground">
              Dashboard ใหม่สำหรับคุม GTD, Kanban และ deadline ในมุมเดียว
            </p>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:gap-2.5 lg:justify-end">
            <Link
              href="/aec-workflow"
              aria-label="User Manual"
              className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-border bg-background px-3 text-[0.92rem] font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground sm:px-3.5"
            >
              <BookOpenText className="size-4" />
              <span className="hidden sm:inline">User Manual</span>
            </Link>
            <Link
              href="/gtd"
              aria-label="GTD Workspace"
              className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-border px-3 text-[0.92rem] font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground sm:px-3.5"
            >
              <ListChecks className="size-4" />
              <span className="hidden sm:inline">GTD Workspace</span>
            </Link>
            <Link
              href="/todos"
              aria-label="Kanban Board"
              className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-border px-3 text-[0.92rem] font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground sm:px-3.5"
            >
              <ListTodo className="size-4" />
              <span className="hidden sm:inline">Kanban Board</span>
            </Link>
            <Link
              href="/settings"
              aria-label="Settings & Export"
              className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-border px-3 text-[0.92rem] font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground sm:px-3.5"
            >
              <Settings2 className="size-4" />
              <span className="hidden md:inline">Settings & Export</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="space-y-5 px-4 py-5 sm:space-y-6 sm:px-6 sm:py-7 lg:px-10 lg:py-8">
        <section className="fade-up grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.92fr)]">
          <div className="overflow-hidden rounded-[2rem] border border-border bg-[radial-gradient(circle_at_top_left,rgba(26,26,26,0.08),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.94),rgba(252,248,242,0.9))] p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="caption-editorial mb-2">Task Control Tower</p>
                <h1 className="font-display text-[2rem] font-medium tracking-tight sm:text-[2.35rem] lg:text-[2.7rem]">
                  เห็นงานค้าง GTD และ Kanban พร้อม deadline ที่ต้องจัดการก่อน
                </h1>
                <p className="mt-3 max-w-2xl text-[0.96rem] leading-6 text-muted-foreground">
                  หน้านี้ตัดส่วน overview แบบเดิมออก แล้วโฟกัสที่ตัวเลขงานค้างจริง งานที่เลย
                  deadline งานที่ครบกำหนดวันนี้ และ workload ที่กระจายอยู่ในระบบทั้งสอง
                </p>
              </div>

              <div className="rounded-[1.4rem] border border-border/80 bg-background/90 p-4 sm:min-w-[16rem]">
                <p className="caption-editorial text-[0.68rem]">Last sync</p>
                <p className="mt-2 text-[0.94rem] font-medium text-foreground">{lastSyncLabel}</p>
                <div className="mt-3 space-y-2">
                  {sourceStatuses.map((source) => (
                    <SourceStatusBadge key={source.label} label={source.label} state={source.state} />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                icon={<Layers3 className="size-4" />}
                label="Outstanding"
                value={combinedOpenCount}
                detail={`${openGtdCount} GTD · ${openTrackerCount} Kanban`}
              />
              <KpiCard
                icon={<AlertTriangle className="size-4" />}
                label="Overdue"
                value={combinedOverdueCount}
                detail="งานที่เลย deadline แล้ว"
                tone={combinedOverdueCount > 0 ? "alert" : "neutral"}
              />
              <KpiCard
                icon={<CalendarDays className="size-4" />}
                label="Due Today"
                value={combinedDueTodayCount}
                detail="งานที่ต้องปิดภายในวันนี้"
                tone={combinedDueTodayCount > 0 ? "warning" : "neutral"}
              />
              <KpiCard
                icon={<Clock3 className="size-4" />}
                label="Next 7 Days"
                value={combinedDueSoonCount}
                detail="งานที่จะเริ่มกดดันในสัปดาห์นี้"
              />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
              <section className="rounded-[1.5rem] border border-border bg-background/80 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="caption-editorial text-[0.68rem]">Priority Now</p>
                    <h2 className="mt-2 font-display text-[1.3rem] font-medium tracking-tight sm:text-[1.5rem]">
                      {focusHeadline}
                    </h2>
                  </div>
                  <span className={reviewToneClassName}>{reviewStatus.title}</span>
                </div>
                <p className="mt-3 text-[0.94rem] leading-6 text-muted-foreground">{focusBody}</p>

                <div className="mt-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">Deadline Health</p>
                    <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                      overdue / today / next 7 days
                    </p>
                  </div>
                  <SegmentedBar items={deadlineSegments} emptyLabel="ยังไม่มี deadline ให้ติดตาม" />
                </div>
              </section>

              <aside className="rounded-[1.5rem] border border-border bg-[#faf7f2] p-4 sm:p-5">
                <p className="caption-editorial text-[0.68rem]">Operational Signals</p>
                <h2 className="mt-2 font-display text-[1.3rem] font-medium tracking-tight sm:text-[1.5rem]">
                  สถานะที่ควรเช็กก่อนเริ่มงาน
                </h2>

                <div className="mt-4 space-y-3">
                  <SignalCard
                    label="Weekly Review"
                    value={reviewStatus.title}
                    detail={reviewStatus.action}
                  />
                  <SignalCard
                    label="Kanban Friction"
                    value={`${blockedTaskCount} blocked · ${waitingTaskCount} waiting`}
                    detail="ใช้ตัวเลขนี้ดูว่าบอร์ดมีงานติดค้างจาก dependency มากแค่ไหน"
                  />
                  <SignalCard
                    label="Follow-up Queue"
                    value={`${staleWaitingCount} stale waiting · ${openReviewCount} review`}
                    detail="เหมาะกับงานติดตามคน งานรอข้อมูล และ review ที่ยังไม่อนุมัติ"
                  />
                </div>

                <div className="mt-5 rounded-[1.2rem] border border-border/80 bg-background/80 p-3.5">
                  <p className="text-sm font-semibold text-foreground">Workload split</p>
                  <p className="mt-1 text-[0.92rem] leading-6 text-muted-foreground">
                    ดูว่างานค้างกระจุกอยู่ที่ GTD หรือ Kanban มากกว่า เพื่อเลือก workspace ให้ตรงก่อน
                  </p>
                  <div className="mt-3">
                    <SegmentedBar items={workloadSegments} emptyLabel="ยังไม่มีงานค้างในระบบ" compact />
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="fade-up grid gap-4 xl:grid-cols-3">
          <DashboardPanel
            icon={<BarChart3 className="size-4" />}
            eyebrow="GTD Analytics"
            title="กราฟ GTD แยกชัดจาก Kanban"
            body="ดูว่างานค้างอยู่ bucket ไหน และใน 7 วันที่ผ่านมา GTD ปิดงานได้ต่อเนื่องแค่ไหน"
          >
            <DistributionList
              title="Open GTD buckets"
              items={gtdCounts.filter((item) => item.value > 0)}
              emptyLabel={gtdState.message}
            />
            <div className="mt-4">
              <DailyTrendCard
                title="GTD completion · 7 วันล่าสุด"
                items={gtdCompletionTrend}
                totalCompleted={gtdCompletionTotal}
                colorClassName="bg-zinc-900"
                emptyLabel="ยังไม่มีงาน GTD ที่ปิดใน 7 วันที่ผ่านมา"
              />
            </div>
          </DashboardPanel>

          <DashboardPanel
            icon={<CheckCircle2 className="size-4" />}
            eyebrow="Kanban Analytics"
            title="กราฟ Kanban แยกชัดจาก GTD"
            body="ดูว่างานทีมติดอยู่ที่ status ไหน และงานที่ปิดจริงในบอร์ดเดินสม่ำเสมอหรือไม่"
          >
            <DistributionList
              title="Open Kanban statuses"
              items={kanbanStatusCounts.filter((item) => item.value > 0)}
              emptyLabel={trackerState.message}
            />
            <div className="mt-4">
              <DailyTrendCard
                title="Kanban completion · 7 วันล่าสุด"
                items={kanbanCompletionTrend}
                totalCompleted={kanbanCompletionTotal}
                colorClassName="bg-sky-500"
                emptyLabel="ยังไม่มีงาน Kanban ที่ปิดใน 7 วันที่ผ่านมา"
              />
            </div>
          </DashboardPanel>

          <DashboardPanel
            icon={<FolderOpen className="size-4" />}
            eyebrow="Client Rooms"
            title="Client Rooms ยังอยู่และกลับมาเป็นส่วนสำคัญ"
            body="ดูจำนวนโปรเจกต์ เอกสาร งานที่ต้อง publish และสถานะ draft / dirty / live ในมุมเดียว"
          >
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <ClientRoomMetric label="Active" value={activeClientRooms} icon={<FolderOpen className="size-4" />} />
              <ClientRoomMetric label="Documents" value={clientRoomDocumentCount} icon={<FileText className="size-4" />} />
              <ClientRoomMetric label="Need Publish" value={clientRoomPendingPublishes} icon={<AlertTriangle className="size-4" />} />
            </div>
            <div className="mt-4">
              <SegmentedBar
                items={clientRoomStatusSegments}
                emptyLabel={clientRoomState.message}
              />
            </div>
            <div className="mt-4 space-y-2">
              {recentClientRooms.length === 0 ? (
                <div className="rounded-[1.2rem] border border-dashed border-border bg-secondary/20 px-4 py-4 text-[0.92rem] text-muted-foreground">
                  {clientRoomState.message}
                </div>
              ) : (
                recentClientRooms.map((project) => (
                  <Link
                    key={project.id}
                    href={`/client-rooms?projectId=${project.id}`}
                    className="group flex items-start gap-3 rounded-[1.15rem] border border-border bg-secondary/20 px-4 py-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/40 hover:bg-background"
                  >
                    <span
                      className={cn(
                        "mt-0.5 inline-flex rounded-full border px-2.5 py-1 text-[0.76rem] font-medium",
                        getClientRoomStatusTone(getClientRoomStatus(project)),
                      )}
                    >
                      {getClientRoomStatusLabel(getClientRoomStatus(project))}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.94rem] font-semibold text-foreground">{project.title}</p>
                      <p className="mt-1 text-[0.82rem] leading-5 text-muted-foreground">
                        {project.clientName} · {project.documentCount} files · อัปเดต {formatPortalDate(project.updatedAt)}
                      </p>
                    </div>
                    <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </Link>
                ))
              )}
            </div>
          </DashboardPanel>
        </section>

        <section className="fade-up grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <DashboardPanel
            icon={<FolderKanban className="size-4" />}
            eyebrow="Project Mix"
            title="รองรับงานหลายประเภท ไม่ได้จำกัดแค่งานสถาปัตยกรรม"
            body="หากเพิ่ม project type เป็น Website, Anime, YouTube Content หรือหมวดอื่น ๆ dashboard จะกระจาย workload ตามประเภทงานให้เองทันที"
          >
            <DistributionList
              title="Top project types"
              items={projectMix}
              emptyLabel="ยังไม่มี project type ให้กระจายผลวิเคราะห์"
            />
          </DashboardPanel>

          <DashboardPanel
            icon={<AlertTriangle className="size-4" />}
            eyebrow="Risk Radar"
            title="รายการที่เสี่ยงหลุด deadline มากที่สุด"
            body="รวมงานจาก GTD และ Kanban ไว้ในลิสต์เดียว เพื่อให้คุณหยิบงานที่เสี่ยงก่อนกลับไป deep work"
          >
            <AttentionList items={riskItems} />
          </DashboardPanel>
        </section>

        <section className="fade-up rounded-[2rem] border border-border bg-background p-5 sm:p-6">
          <div className="max-w-3xl">
            <p className="caption-editorial mb-2">Suggested Next Improvements</p>
            <h2 className="font-display text-[1.7rem] font-medium tracking-tight sm:text-[2rem]">
              ถ้าจะใช้กับ Website, Anime, Content หรือโปรเจกต์ส่วนตัว ควรเพิ่มอะไรต่อ
            </h2>
            <p className="mt-3 text-[0.95rem] leading-6 text-muted-foreground">
              โครง GTD + Kanban ตอนนี้ใช้ต่อได้เลย แต่ถ้าจะให้เหมาะกับงาน creative หรือ digital
              project มากขึ้น แนะนำให้เพิ่ม template และ metadata ตามลักษณะงานจริง
            </p>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            <RecommendationCard
              title="Custom project types"
              body="ตั้ง project type ให้สะท้อนงานจริง เช่น Website, Anime, YouTube Content, Marketing, Admin เพื่อให้ dashboard วิเคราะห์ workload ตามหมวดงานได้แม่นขึ้น"
            />
            <RecommendationCard
              title="Pipeline templates"
              body="งานแต่ละชนิดควรมีสถานะไม่เหมือนกัน เช่น script → storyboard → edit → publish หรือ brief → design → build → QA → launch"
            />
            <RecommendationCard
              title="Creative contexts"
              body="GTD จะทรงพลังขึ้นถ้ามี context หรือ tag สำหรับงานอย่าง writing, recording, editing, rendering, review และ publishing"
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  detail,
  tone = "neutral",
}: {
  icon: ReactNode;
  label: string;
  value: number;
  detail: string;
  tone?: "neutral" | "warning" | "alert";
}) {
  return (
    <article
      className={cn(
        "rounded-[1.35rem] border p-4",
        tone === "neutral" && "border-border bg-background/80",
        tone === "warning" && "border-amber-200 bg-amber-50/80",
        tone === "alert" && "border-rose-200 bg-rose-50/80",
      )}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="caption-editorial text-[0.68rem]">{label}</span>
      </div>
      <p className="mt-3 font-display text-[2rem] font-medium tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-1 text-[0.9rem] leading-6 text-muted-foreground">{detail}</p>
    </article>
  );
}

function DashboardPanel({
  icon,
  eyebrow,
  title,
  body,
  children,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.8rem] border border-border bg-background p-5 sm:p-6">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="caption-editorial text-[0.68rem]">{eyebrow}</span>
      </div>
      <h2 className="mt-3 font-display text-[1.45rem] font-medium tracking-tight sm:text-[1.65rem]">
        {title}
      </h2>
      <p className="mt-2 max-w-3xl text-[0.94rem] leading-6 text-muted-foreground">{body}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function SignalCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[1.2rem] border border-border/80 bg-background/80 p-3.5">
      <p className="caption-editorial text-[0.68rem]">{label}</p>
      <p className="mt-2 text-[1rem] font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-1.5 text-[0.9rem] leading-6 text-muted-foreground">{detail}</p>
    </div>
  );
}

function SourceStatusBadge({
  label,
  state,
}: {
  label: string;
  state: SourceState;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-full border px-3 py-2 text-[0.88rem]",
        state.tone === "ready" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        state.tone === "loading" && "border-stone-200 bg-stone-50 text-stone-700",
        state.tone === "error" && "border-rose-200 bg-rose-50 text-rose-700",
      )}
    >
      <span className="font-medium">{label}</span>
      <span className="truncate text-right">{state.message}</span>
    </div>
  );
}

function SegmentedBar({
  items,
  emptyLabel,
  compact = false,
}: {
  items: DistributionItem[];
  emptyLabel: string;
  compact?: boolean;
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div className="rounded-[1.2rem] border border-dashed border-border bg-secondary/20 px-4 py-5 text-[0.92rem] text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", compact && "space-y-2.5")}>
      <div className="flex h-3 overflow-hidden rounded-full bg-secondary">
        {items.map((item) => (
          <div
            key={item.label}
            className={item.colorClassName}
            style={{
              width: `${(item.value / total) * 100}%`,
              minWidth: item.value > 0 ? "0.55rem" : "0",
            }}
          />
        ))}
      </div>

      <div className={cn("grid gap-2 sm:grid-cols-2", compact && "gap-1.5")}>
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-3 rounded-[1rem] border border-border/70 bg-background/70 px-3 py-2"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className={cn("size-2.5 rounded-full", item.colorClassName)} />
              <span className="truncate text-[0.92rem] text-foreground">{item.label}</span>
            </div>
            <span className="text-[0.92rem] font-semibold text-foreground">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DistributionList({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: DistributionItem[];
  emptyLabel: string;
}) {
  const max = Math.max(...items.map((item) => item.value), 0);

  return (
    <div className="rounded-[1.3rem] border border-border bg-secondary/25 p-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>

      {items.length === 0 ? (
        <p className="mt-4 text-[0.92rem] leading-6 text-muted-foreground">{emptyLabel}</p>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div key={item.label} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[0.94rem] font-medium text-foreground">{item.label}</p>
                  {item.hint ? (
                    <p className="truncate text-[0.82rem] text-muted-foreground">{item.hint}</p>
                  ) : null}
                </div>
                <span className="text-[0.92rem] font-semibold text-foreground">{item.value}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-background">
                <div
                  className={cn("h-full rounded-full", item.colorClassName)}
                  style={{
                    width: `${max === 0 ? 0 : (item.value / max) * 100}%`,
                    minWidth: item.value > 0 ? "0.5rem" : "0",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AttentionList({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-[1.3rem] border border-dashed border-border bg-secondary/20 px-4 py-5 text-[0.92rem] text-muted-foreground">
        ตอนนี้ยังไม่มีงานที่ overdue หรือใกล้ deadline มากพอจะขึ้น risk radar
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Link
          key={`${item.system}-${item.id}`}
          href={item.href}
          className="group flex items-start gap-3 rounded-[1.2rem] border border-border bg-secondary/20 px-4 py-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/40 hover:bg-background"
        >
          <span
            className={cn(
              "mt-0.5 inline-flex rounded-full border px-2.5 py-1 text-[0.76rem] font-medium",
              deadlineToneClassNames[item.tone],
            )}
          >
            {item.system}
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-[0.95rem] font-semibold text-foreground">{item.title}</p>
            <p className="mt-1 text-[0.88rem] leading-5 text-muted-foreground">{item.context}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[0.76rem] font-medium",
                  deadlineToneClassNames[item.tone],
                )}
              >
                {item.dueLabel}
              </span>
              <span className="text-[0.82rem] text-muted-foreground">
                {formatDueDate(item.dueDate)}
              </span>
            </div>
          </div>

          <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-foreground" />
        </Link>
      ))}
    </div>
  );
}

function ClientRoomMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[1.1rem] border border-border bg-secondary/20 px-3.5 py-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="caption-editorial text-[0.68rem]">{label}</span>
      </div>
      <p className="mt-2 font-display text-[1.45rem] font-medium tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}

function DailyTrendCard({
  title,
  items,
  totalCompleted,
  colorClassName,
  emptyLabel,
}: {
  title: string;
  items: DailySeriesPoint[];
  totalCompleted: number;
  colorClassName: string;
  emptyLabel: string;
}) {
  const max = Math.max(...items.map((item) => item.value), 0);

  return (
    <div className="rounded-[1.3rem] border border-border bg-secondary/25 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <span className="text-[0.92rem] text-muted-foreground">
          ปิดงานรวม {totalCompleted}
        </span>
      </div>

      {totalCompleted === 0 ? (
        <p className="mt-4 text-[0.92rem] leading-6 text-muted-foreground">{emptyLabel}</p>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div key={item.fullLabel} className="grid gap-2 sm:grid-cols-[5.2rem_minmax(0,1fr)_3rem] sm:items-center">
              <div>
                <p className="text-[0.9rem] font-medium text-foreground">{item.label}</p>
                <p className="text-[0.8rem] text-muted-foreground">{item.fullLabel}</p>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-background">
                <div
                  className={cn("h-full rounded-full", colorClassName)}
                  style={{
                    width: `${max === 0 ? 0 : (item.value / max) * 100}%`,
                    minWidth: item.value > 0 ? "0.4rem" : "0",
                  }}
                />
              </div>
              <p className="text-right text-[0.94rem] font-semibold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RecommendationCard({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <article className="rounded-[1.4rem] border border-border bg-secondary/25 p-4">
      <p className="text-[1rem] font-semibold tracking-tight text-foreground">{title}</p>
      <p className="mt-2 text-[0.92rem] leading-6 text-muted-foreground">{body}</p>
    </article>
  );
}

function getClientRoomStatus(project: ClientRoomProjectSummary): ClientRoomStatus {
  if (!project.publishedAt) {
    return "draft";
  }

  if (new Date(project.updatedAt).getTime() > new Date(project.publishedAt).getTime()) {
    return "dirty";
  }

  return "live";
}

function getClientRoomStatusLabel(status: ClientRoomStatus) {
  switch (status) {
    case "draft":
      return "Draft";
    case "dirty":
      return "Dirty";
    case "live":
      return "Live";
  }
}

function getClientRoomStatusTone(status: ClientRoomStatus) {
  switch (status) {
    case "draft":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "dirty":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "live":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
}

function getDayStart(value: number) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function getDueDay(value: string | null) {
  if (!value) return null;
  const date = parseDateInput(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function isOverdue(value: string | null, todayStart: number) {
  const dueDay = getDueDay(value);
  return dueDay !== null && dueDay < todayStart;
}

function isDueToday(value: string | null, todayStart: number) {
  const dueDay = getDueDay(value);
  return dueDay !== null && dueDay === todayStart;
}

function isDueBetween(value: string | null, start: number, end: number) {
  const dueDay = getDueDay(value);
  return dueDay !== null && dueDay >= start && dueDay <= end;
}

function isTimestampInRange(value: string | null, start: number, end: number) {
  if (!value) return false;
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return false;
  return timestamp >= start && timestamp < end;
}

function getDeadlineTone(
  value: string | null,
  todayStart: number,
  sevenDayWindowEnd: number,
): DeadlineTone | null {
  if (isOverdue(value, todayStart)) return "overdue";
  if (isDueToday(value, todayStart)) return "today";
  if (isDueBetween(value, todayStart + DAY_MS, sevenDayWindowEnd)) return "soon";
  return null;
}

function compareAttentionItems(a: AttentionItem, b: AttentionItem) {
  const toneRank: Record<DeadlineTone, number> = {
    overdue: 0,
    today: 1,
    soon: 2,
  };

  if (toneRank[a.tone] !== toneRank[b.tone]) {
    return toneRank[a.tone] - toneRank[b.tone];
  }

  return parseDateInput(a.dueDate).getTime() - parseDateInput(b.dueDate).getTime();
}

function formatShortDay(value: number) {
  return new Intl.DateTimeFormat("th-TH", { weekday: "short" }).format(value);
}

function formatDateLabel(value: number) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
  }).format(value);
}

function formatDueDate(value: string) {
  const date = parseDateInput(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function parseDateInput(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }

  return new Date(value);
}

async function getTrackerWorkspace(): Promise<TrackerWorkspaceData> {
  const response = await fetch("/api/tracker/workspace", { cache: "no-store" });
  const data = (await response.json()) as { error?: string; workspace?: TrackerWorkspaceData };

  if (!response.ok || !data.workspace) {
    throw new Error(data.error || "Kanban board unavailable.");
  }

  return data.workspace;
}

async function getClientRoomProjects(): Promise<ClientRoomProjectSummary[]> {
  const response = await fetch("/api/client-rooms/projects", { cache: "no-store" });
  const data = (await response.json()) as {
    error?: string;
    projects?: ClientRoomProjectSummary[];
  };

  if (!response.ok || !data.projects) {
    throw new Error(data.error || "Client Rooms unavailable.");
  }

  return data.projects;
}
