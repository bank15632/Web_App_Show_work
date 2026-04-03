"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  BarChart3,
  BookOpenText,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
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
  type GtdItem,
} from "@/lib/gtd-system";
import { formatPortalDate } from "@/lib/portal-data";
import { priorityLabels, taskStatusLabels } from "@/lib/tracker/constants";
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

type KpiTone = "neutral" | "warning" | "alert" | "accent";

type TaskControlView = "timeline" | "table" | "calendar" | "chart";

type TaskControlStage = DeadlineTone | "later" | "none";
type TaskControlSortKey = "title" | "scope" | "due" | "priority";
type SortDirection = "asc" | "desc";

type TaskControlMetric = {
  icon: ReactNode;
  label: string;
  value: number;
  detail: string;
  tone?: KpiTone;
};

type TaskControlRecord = {
  id: string;
  title: string;
  detail: string;
  supportingText: string;
  dueDate: string | null;
  href: string;
  stage: TaskControlStage;
  updatedAt: string;
  priorityLabel: string;
  priorityRank: number;
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

const taskControlViewOptions: Array<{ id: TaskControlView; label: string }> = [
  { id: "timeline", label: "Timeline" },
  { id: "table", label: "Table Data" },
  { id: "calendar", label: "Calendar" },
  { id: "chart", label: "Chart" },
];

const taskControlStageClassNames: Record<TaskControlStage, string> = {
  overdue: "border-rose-200 bg-rose-50 text-rose-700",
  today: "border-amber-200 bg-amber-50 text-amber-700",
  soon: "border-sky-200 bg-sky-50 text-sky-700",
  later: "border-stone-200 bg-stone-100 text-stone-700",
  none: "border-violet-200 bg-violet-50 text-violet-700",
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
        setGtdState({
          tone: "ready",
          message: "GTD workspace พร้อมใช้งาน",
        });
      } else {
        setGtdItems([]);
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

  const gtdCompletionTotal = gtdCompletionTrend.reduce((sum, point) => sum + point.value, 0);
  const kanbanCompletionTotal = kanbanCompletionTrend.reduce((sum, point) => sum + point.value, 0);
  const gtdTaskControlItems = useMemo<TaskControlRecord[]>(
    () =>
      openGtdItems
        .map((item) => ({
          id: item.id,
          title: item.text,
          detail: bucketLabels[item.bucket],
          supportingText: `${formatTaskControlContext(item.context)} · ${priorityLabels[item.priority]} priority`,
          dueDate: item.dueDate,
          href: "/gtd",
          stage: getTaskControlStage(item.dueDate, todayStart, sevenDayWindowEnd),
          updatedAt: item.updatedAt,
          priorityLabel: priorityLabels[item.priority],
          priorityRank: getPriorityRank(item.priority),
        }))
        .sort((a, b) => compareTaskControlRecords(a, b)),
    [openGtdItems, sevenDayWindowEnd, todayStart],
  );
  const kanbanTaskControlItems = useMemo<TaskControlRecord[]>(
    () =>
      openTrackerTasks
        .map((task) => ({
          id: task.id,
          title: task.title,
          detail: `${task.projectName} · ${taskStatusLabels[task.status]}`,
          supportingText: `${priorityLabels[task.priority]} priority${task.assignee ? ` · ${task.assignee}` : ""}`,
          dueDate: task.dueDate,
          href: "/todos",
          stage: getTaskControlStage(task.dueDate, todayStart, sevenDayWindowEnd),
          updatedAt: task.updatedAt,
          priorityLabel: priorityLabels[task.priority],
          priorityRank: getPriorityRank(task.priority),
        }))
        .sort((a, b) => compareTaskControlRecords(a, b)),
    [openTrackerTasks, sevenDayWindowEnd, todayStart],
  );
  const gtdTaskControlMetrics: TaskControlMetric[] = [
    {
      icon: <Layers3 className="size-4" />,
      label: "Outstanding",
      value: openGtdCount,
      detail: "งาน GTD ที่ยังไม่ปิด",
    },
    {
      icon: <AlertTriangle className="size-4" />,
      label: "Overdue",
      value: gtdOverdueCount,
      detail: "เลยกำหนดแล้ว",
      tone: gtdOverdueCount > 0 ? "alert" : "neutral",
    },
    {
      icon: <CalendarDays className="size-4" />,
      label: "Due Today",
      value: gtdDueTodayCount,
      detail: "ต้องหยิบปิดวันนี้",
      tone: gtdDueTodayCount > 0 ? "warning" : "neutral",
    },
    {
      icon: <Clock3 className="size-4" />,
      label: "Next 7 Days",
      value: gtdDueSoonCount,
      detail: "กำลังจะถึงใน 7 วัน",
    },
    {
      icon: <CalendarDays className="size-4" />,
      label: "No Deadline",
      value: gtdNoDeadlineCount,
      detail: "ยังไม่ตั้ง due date",
      tone: "accent",
    },
  ];
  const kanbanTaskControlMetrics: TaskControlMetric[] = [
    {
      icon: <Layers3 className="size-4" />,
      label: "Outstanding",
      value: openTrackerCount,
      detail: "การ์ด Kanban ที่ยังไม่ปิด",
    },
    {
      icon: <AlertTriangle className="size-4" />,
      label: "Overdue",
      value: trackerOverdueCount,
      detail: "เลยกำหนดแล้ว",
      tone: trackerOverdueCount > 0 ? "alert" : "neutral",
    },
    {
      icon: <CalendarDays className="size-4" />,
      label: "Due Today",
      value: trackerDueTodayCount,
      detail: "ต้องหยิบปิดวันนี้",
      tone: trackerDueTodayCount > 0 ? "warning" : "neutral",
    },
    {
      icon: <Clock3 className="size-4" />,
      label: "Next 7 Days",
      value: trackerDueSoonCount,
      detail: "กำลังจะถึงใน 7 วัน",
    },
    {
      icon: <CalendarDays className="size-4" />,
      label: "No Deadline",
      value: trackerNoDeadlineCount,
      detail: "ยังไม่ตั้ง due date",
      tone: "accent",
    },
  ];

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#fbf7f1_42%,#ffffff_100%)]"
    >
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-[10px]">
        <div className="flex flex-col gap-3 px-4 py-3.5 sm:px-6 lg:flex-row lg:items-center lg:gap-5 lg:px-10">
          <Image
            src="/logo-bnj.svg"
            alt="BNJ Studio"
            width={120}
            height={60}
            priority
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
        <section className="fade-up">
          <div className="overflow-hidden rounded-[2rem] border border-border bg-[radial-gradient(circle_at_top_left,rgba(26,26,26,0.08),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.94),rgba(252,248,242,0.9))] p-5 sm:p-6">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,360px)] xl:items-start">
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

            <div className="mt-6 space-y-4">
              <TaskControlBoard
                icon={<ListChecks className="size-4" />}
                eyebrow="GTD"
                title="GTD task control"
                body="แยก backlog ของ GTD ออกจากบอร์ด Kanban เพื่อให้ deadline และรายการที่ยังไม่มี due date อ่านได้ในมุมเดียว"
                href="/gtd"
                ctaLabel="Open GTD Workspace"
                metrics={gtdTaskControlMetrics}
                items={gtdTaskControlItems}
                emptyLabel="ยังไม่มีงาน GTD ค้างในระบบ"
                todayStart={todayStart}
              />
              <TaskControlBoard
                icon={<ListTodo className="size-4" />}
                eyebrow="Kanban"
                title="Kanban task control"
                body="ดูการ์ดใน project board แบบไม่ปนกับ GTD เพื่อเห็นงานส่งมอบที่ overdue งานที่ใกล้ครบกำหนด และงานที่ยังไม่มี deadline"
                href="/todos"
                ctaLabel="Open Kanban Board"
                metrics={kanbanTaskControlMetrics}
                items={kanbanTaskControlItems}
                emptyLabel="ยังไม่มีการ์ด Kanban ค้างในระบบ"
                todayStart={todayStart}
              />
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
  tone?: KpiTone;
}) {
  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-[1.35rem] border p-4",
        tone === "neutral" && "border-border bg-background/80",
        tone === "warning" && "border-amber-200 bg-amber-50/80",
        tone === "alert" && "border-rose-200 bg-rose-50/80",
        tone === "accent" && "border-violet-200 bg-violet-50/90",
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

function TaskControlBoard({
  icon,
  eyebrow,
  title,
  body,
  href,
  ctaLabel,
  metrics,
  items,
  emptyLabel,
  todayStart,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  ctaLabel: string;
  metrics: TaskControlMetric[];
  items: TaskControlRecord[];
  emptyLabel: string;
  todayStart: number;
}) {
  const [activeView, setActiveView] = useState<TaskControlView>("timeline");

  return (
    <section className="rounded-[1.6rem] border border-border bg-background/80 p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-muted-foreground">
            {icon}
            <span className="caption-editorial text-[0.68rem]">{eyebrow}</span>
          </div>
          <h2 className="mt-3 font-display text-[1.35rem] font-medium tracking-tight sm:text-[1.55rem]">
            {title}
          </h2>
          <p className="mt-2 text-[0.94rem] leading-6 text-muted-foreground">{body}</p>
        </div>

        <Link
          href={href}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-border bg-background px-4 text-[0.92rem] font-medium text-foreground transition-colors hover:border-foreground"
        >
          {ctaLabel}
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {taskControlViewOptions.map((option) => (
          <button
            key={`${eyebrow}-${option.id}`}
            type="button"
            onClick={() => setActiveView(option.id)}
            className={cn(
              "inline-flex h-9 items-center rounded-full border px-3.5 text-[0.9rem] font-medium transition-colors",
              activeView === option.id
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {metrics.map((metric) => (
          <KpiCard
            key={`${eyebrow}-${metric.label}`}
            icon={metric.icon}
            label={metric.label}
            value={metric.value}
            detail={metric.detail}
            tone={metric.tone}
          />
        ))}
      </div>

      <div className="mt-5">
        {activeView === "timeline" ? (
          <TaskControlTimelineView items={items} emptyLabel={emptyLabel} todayStart={todayStart} />
        ) : activeView === "table" ? (
          <TaskControlTableView items={items} emptyLabel={emptyLabel} />
        ) : activeView === "calendar" ? (
          <TaskControlCalendarView items={items} emptyLabel={emptyLabel} todayStart={todayStart} />
        ) : (
          <TaskControlChartView items={items} emptyLabel={emptyLabel} todayStart={todayStart} />
        )}
      </div>
    </section>
  );
}

function TaskControlTimelineView({
  items,
  emptyLabel,
  todayStart,
}: {
  items: TaskControlRecord[];
  emptyLabel: string;
  todayStart: number;
}) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const noDateItems = useMemo(() => items.filter((item) => item.stage === "none"), [items]);
  const rangeStart = todayStart - DAY_MS * 15 + DAY_MS * 7 * weekOffset;
  const days = useMemo(
    () =>
      Array.from({ length: 32 }, (_, index) => {
        const time = rangeStart + DAY_MS * index;
        return {
          id: time.toString(),
          time,
          dayLabel: new Intl.DateTimeFormat("en-US", { day: "numeric" }).format(time),
          monthKey: new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(time),
        };
      }),
    [rangeStart],
  );
  const monthLabels = useMemo(
    () =>
      days.flatMap((day, index) =>
        index === 0 || days[index - 1]?.monthKey !== day.monthKey
          ? [{ label: day.monthKey, index }]
          : [],
      ),
    [days],
  );
  const timelineMap = useMemo(() => {
    const grouped = new Map<number, TaskControlRecord[]>();

    for (const item of items) {
      const dueDay = getDueDay(item.dueDate);
      if (dueDay === null) continue;
      if (dueDay < rangeStart || dueDay >= rangeStart + DAY_MS * days.length) continue;

      const current = grouped.get(dueDay) ?? [];
      current.push(item);
      grouped.set(dueDay, current);
    }

    for (const value of grouped.values()) {
      value.sort((a, b) => compareTaskControlRecords(a, b));
    }

    return grouped;
  }, [days.length, items, rangeStart]);
  const datedKeys = useMemo(
    () => days.filter((day) => (timelineMap.get(day.time)?.length ?? 0) > 0).map((day) => day.id),
    [days, timelineMap],
  );
  const fallbackKey = useMemo(() => {
    if (datedKeys.includes(todayStart.toString())) return todayStart.toString();
    if (datedKeys.length > 0) return datedKeys[0];
    if (noDateItems.length > 0) return "none";
    return null;
  }, [datedKeys, noDateItems.length, todayStart]);
  const activeKey =
    selectedKey === "none"
      ? noDateItems.length > 0
        ? "none"
        : fallbackKey
      : selectedKey && datedKeys.includes(selectedKey)
        ? selectedKey
        : fallbackKey;
  const activeItems =
    activeKey === "none"
      ? noDateItems
      : activeKey
        ? timelineMap.get(Number(activeKey)) ?? []
        : [];
  const activeLabel =
    activeKey === "none"
      ? `No date · ${noDateItems.length} tasks`
      : activeKey
        ? formatFullDate(Number(activeKey))
        : "No active date";

  if (items.length === 0) {
    return <TaskControlEmptyState label={emptyLabel} />;
  }

  return (
    <div className="space-y-4 rounded-[1.35rem] border border-border bg-secondary/20 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex rounded-full border border-border bg-background px-3 py-1.5 text-[0.88rem] font-medium text-foreground">
            Timeline
          </span>
          <button
            type="button"
            onClick={() => setSelectedKey("none")}
            className={cn(
              "inline-flex rounded-full border px-3 py-1.5 text-[0.88rem] font-medium transition-colors",
              activeKey === "none"
                ? "border-violet-300 bg-violet-100 text-violet-800"
                : "border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-300",
            )}
          >
            No date ({noDateItems.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekOffset((value) => value - 1)}
            className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
            aria-label="Previous timeline window"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset(0)}
            className="inline-flex h-9 items-center rounded-full border border-border bg-background px-3.5 text-[0.88rem] font-medium text-foreground transition-colors hover:border-foreground"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset((value) => value + 1)}
            className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
            aria-label="Next timeline window"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="min-w-[70rem]">
          <div className="relative h-7">
            {monthLabels.map((month) => (
              <div
                key={month.label}
                className="absolute top-0 text-[0.9rem] font-medium text-foreground"
                style={{ left: `calc(${(month.index / days.length) * 100}% + 0.25rem)` }}
              >
                {month.label}
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-32 gap-0">
            {days.map((day) => {
              const isActive = activeKey === day.id;
              const isToday = day.time === todayStart;

              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => setSelectedKey(day.id)}
                  className={cn(
                    "flex h-10 items-center justify-center border-y border-r border-border/70 text-[0.8rem] text-muted-foreground first:border-l hover:bg-background/60",
                    isActive && "bg-background text-foreground",
                  )}
                >
                  <div className="flex flex-col items-center">
                    <span>{day.dayLabel}</span>
                    {isToday ? <span className="mt-0.5 size-1.5 rounded-full bg-rose-500" /> : null}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="relative grid h-28 grid-cols-32 overflow-hidden rounded-b-[1.15rem] border-x border-b border-border/70 bg-background/70">
            <div className="pointer-events-none absolute left-0 right-0 top-[4rem] h-px bg-border/80" />
            {days.map((day, index) => {
              const dayItems = timelineMap.get(day.time) ?? [];
              const isActive = activeKey === day.id;

              return (
                <button
                  key={`${day.id}-lane`}
                  type="button"
                  onClick={() => setSelectedKey(day.id)}
                  className={cn(
                    "relative border-r border-border/60 transition-colors first:border-l",
                    index % 2 === 0 ? "bg-secondary/30" : "bg-background/50",
                    isActive && "bg-rose-50/60",
                  )}
                >
                  {dayItems.length > 0 ? (
                    <>
                      <span
                        className={cn(
                          "absolute left-1/2 top-4 inline-flex -translate-x-1/2 items-center justify-center rounded-full text-[0.72rem] font-semibold",
                          dayItems.length > 9 ? "size-7" : "size-6",
                          isActive
                            ? "bg-rose-500 text-white"
                            : "border border-rose-200 bg-white text-rose-600",
                        )}
                      >
                        {dayItems.length}
                      </span>
                      <span
                        className={cn(
                          "absolute left-1/2 top-10 h-10 -translate-x-1/2 border-l",
                          isActive ? "border-rose-400" : "border-rose-200",
                        )}
                      />
                    </>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <section className="rounded-[1.2rem] border border-border bg-background/80 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">{activeLabel}</p>
            <p className="text-[0.84rem] text-muted-foreground">
              {activeItems.length} tasks in focus
            </p>
          </div>
          <span
            className={cn(
              "inline-flex rounded-full border px-2.5 py-1 text-[0.76rem] font-medium",
              activeKey === "none"
                ? taskControlStageClassNames.none
                : taskControlStageClassNames[getTaskControlStageForKey(activeKey, todayStart)],
            )}
          >
            {activeKey === "none"
              ? "No Deadline"
              : activeKey
                ? getTaskControlStageLabel(getTaskControlStageForKey(activeKey, todayStart))
                : "Timeline"}
          </span>
        </div>

        {activeItems.length === 0 ? (
          <p className="mt-3 text-[0.88rem] text-muted-foreground">ไม่มีงานในช่วงที่เลือก</p>
        ) : (
          <div className="mt-4 grid gap-3 xl:grid-cols-2">
            {activeItems.map((item) => (
              <TaskControlItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function TaskControlTableView({
  items,
  emptyLabel,
}: {
  items: TaskControlRecord[];
  emptyLabel: string;
}) {
  const [sortKey, setSortKey] = useState<TaskControlSortKey>("due");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const sortedItems = useMemo(
    () => sortTaskControlItems(items, sortKey, sortDirection),
    [items, sortDirection, sortKey],
  );

  if (items.length === 0) {
    return <TaskControlEmptyState label={emptyLabel} />;
  }

  return (
    <div className="overflow-hidden rounded-[1.35rem] border border-border bg-secondary/20">
      <div className="overflow-x-auto">
        <div className="min-w-[62rem]">
          <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1.15fr)_minmax(10rem,0.8fr)_8rem] gap-3 border-b border-border/80 px-4 py-3 text-[0.76rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            <TaskControlSortButton
              label="Task"
              sortKey="title"
              activeKey={sortKey}
              direction={sortDirection}
              onClick={(key) => toggleTaskControlSort(key, sortKey, sortDirection, setSortKey, setSortDirection)}
            />
            <TaskControlSortButton
              label="Scope"
              sortKey="scope"
              activeKey={sortKey}
              direction={sortDirection}
              onClick={(key) => toggleTaskControlSort(key, sortKey, sortDirection, setSortKey, setSortDirection)}
            />
            <TaskControlSortButton
              label="Due"
              sortKey="due"
              activeKey={sortKey}
              direction={sortDirection}
              align="end"
              onClick={(key) => toggleTaskControlSort(key, sortKey, sortDirection, setSortKey, setSortDirection)}
            />
            <TaskControlSortButton
              label="Priority"
              sortKey="priority"
              activeKey={sortKey}
              direction={sortDirection}
              align="end"
              onClick={(key) => toggleTaskControlSort(key, sortKey, sortDirection, setSortKey, setSortDirection)}
            />
          </div>

          <div className="max-h-[24rem] overflow-auto">
            {sortedItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="block border-b border-border/70 px-4 py-3 transition-colors hover:bg-background/80 last:border-b-0"
              >
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1.15fr)_minmax(10rem,0.8fr)_8rem] lg:items-center">
                  <div className="min-w-0">
                    <p className="truncate text-[0.95rem] font-semibold text-foreground">{item.title}</p>
                    <p className="mt-1 text-[0.82rem] text-muted-foreground lg:hidden">
                      {item.detail}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-[0.88rem] text-foreground">{item.detail}</p>
                    <p className="mt-1 truncate text-[0.8rem] text-muted-foreground">
                      {item.supportingText}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2.5 py-1 text-[0.72rem] font-medium",
                        taskControlStageClassNames[item.stage],
                      )}
                    >
                      {getTaskControlStageLabel(item.stage)}
                    </span>
                    <span className="text-[0.82rem] text-muted-foreground">
                      {item.dueDate ? formatDueDate(item.dueDate) : "No due date"}
                    </span>
                  </div>

                  <p className="text-[0.88rem] font-medium text-foreground lg:text-right">
                    {item.priorityLabel}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskControlCalendarView({
  items,
  emptyLabel,
  todayStart,
}: {
  items: TaskControlRecord[];
  emptyLabel: string;
  todayStart: number;
}) {
  const [monthStart, setMonthStart] = useState(() => getMonthStart(todayStart));
  const noDateItems = useMemo(() => items.filter((item) => item.stage === "none"), [items]);
  const calendarMap = useMemo(() => {
    const grouped = new Map<number, TaskControlRecord[]>();

    for (const item of items) {
      const dueDay = getDueDay(item.dueDate);
      if (dueDay === null) continue;
      const current = grouped.get(dueDay) ?? [];
      current.push(item);
      grouped.set(dueDay, current);
    }

    for (const value of grouped.values()) {
      value.sort((a, b) => compareTaskControlRecords(a, b));
    }

    return grouped;
  }, [items]);
  const calendarDays = useMemo(() => buildCalendarDays(monthStart), [monthStart]);

  if (items.length === 0) {
    return <TaskControlEmptyState label={emptyLabel} />;
  }

  return (
    <div className="space-y-4 rounded-[1.35rem] border border-border bg-secondary/20 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex rounded-full border border-border bg-background px-3 py-1.5 text-[0.88rem] font-medium text-foreground">
            Calendar
          </span>
          <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-[0.88rem] font-medium text-violet-700">
            No date ({noDateItems.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMonthStart((value) => shiftMonth(value, -1))}
            className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setMonthStart(getMonthStart(todayStart))}
            className="inline-flex h-9 items-center rounded-full border border-border bg-background px-3.5 text-[0.88rem] font-medium text-foreground transition-colors hover:border-foreground"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setMonthStart((value) => shiftMonth(value, 1))}
            className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <section className="rounded-[1.2rem] border border-border bg-background/80">
        <div className="flex flex-col gap-3 border-b border-border/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[1.05rem] font-semibold text-foreground">{formatMonthHeading(monthStart)}</p>
          <p className="text-[0.84rem] text-muted-foreground">
            Month view of dated tasks
          </p>
        </div>

        <div className="grid grid-cols-7 border-b border-border/70 bg-background/70">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="px-3 py-2 text-center text-[0.76rem] font-medium uppercase tracking-[0.12em] text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const dayItems = calendarMap.get(day.time) ?? [];
            const isCurrentMonth = day.month === new Date(monthStart).getMonth();
            const isToday = day.time === todayStart;

            return (
              <div
                key={day.id}
                className={cn(
                  "min-h-[8.4rem] border-r border-b border-border/70 px-3 py-3 last:border-r-0 sm:min-h-[9.2rem]",
                  !isCurrentMonth && "bg-secondary/15 text-muted-foreground/70",
                  isToday && "bg-rose-50/40",
                  index % 7 === 6 && "border-r-0",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={cn(
                      "text-[0.84rem] font-medium",
                      isCurrentMonth ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {day.label}
                  </span>
                  {dayItems.length > 0 ? (
                    <span className="inline-flex size-7 items-center justify-center rounded-full bg-rose-500 text-[0.78rem] font-semibold text-white">
                      {dayItems.length}
                    </span>
                  ) : null}
                </div>

                <div className="mt-3 space-y-1.5">
                  {dayItems.slice(0, 2).map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={cn(
                        "block truncate rounded-full border px-2.5 py-1 text-[0.76rem] font-medium transition-colors hover:border-foreground/40 hover:bg-background",
                        taskControlStageClassNames[item.stage],
                      )}
                    >
                      {item.title}
                    </Link>
                  ))}
                  {dayItems.length > 2 ? (
                    <p className="text-[0.76rem] text-muted-foreground">
                      +{dayItems.length - 2} more
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {noDateItems.length > 0 ? (
        <section className="rounded-[1.2rem] border border-violet-200 bg-violet-50/80 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-violet-900">No date queue</p>
            <span className="text-[0.84rem] text-violet-700">{noDateItems.length} tasks</span>
          </div>
          <div className="mt-3 grid gap-3 xl:grid-cols-2">
            {noDateItems.slice(0, 4).map((item) => (
              <TaskControlItemCard key={item.id} item={item} compact />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function TaskControlChartView({
  items,
  emptyLabel,
  todayStart,
}: {
  items: TaskControlRecord[];
  emptyLabel: string;
  todayStart: number;
}) {
  const noDateCount = useMemo(
    () => items.filter((item) => item.stage === "none").length,
    [items],
  );
  const chartDays = useMemo(() => {
    const datedItems = items.filter((item) => item.dueDate);
    const anchor =
      datedItems.length > 0
        ? Math.min(...datedItems.map((item) => getDueDay(item.dueDate) ?? Number.POSITIVE_INFINITY))
        : todayStart;
    const start = getDayStart(anchor - DAY_MS * 3);

    return Array.from({ length: 18 }, (_, index) => {
      const dayStart = start + DAY_MS * index;
      const count = items.filter((item) => getDueDay(item.dueDate) === dayStart).length;

      return {
        id: dayStart.toString(),
        time: dayStart,
        label: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(dayStart),
        shortLabel: new Intl.DateTimeFormat("en-US", { day: "numeric" }).format(dayStart),
        value: count,
      };
    });
  }, [items, todayStart]);
  const max = Math.max(...chartDays.map((item) => item.value), 0);
  const chartGeometry = useMemo(() => buildAreaChartGeometry(chartDays, max), [chartDays, max]);

  if (items.length === 0) {
    return <TaskControlEmptyState label={emptyLabel} />;
  }

  return (
    <div className="rounded-[1.35rem] border border-border bg-secondary/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Due date load curve</p>
          <p className="mt-1 text-[0.88rem] text-muted-foreground">
            Area chart ของงานที่มี due date ตามลำดับวัน
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[0.88rem] text-muted-foreground">Open tasks {items.length}</span>
          <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[0.78rem] font-medium text-violet-700">
            No date {noDateCount}
          </span>
        </div>
      </div>

      <div className="mt-4 rounded-[1.2rem] border border-border bg-background/80 p-4">
        <div className="relative h-[19rem]">
          <svg viewBox="0 0 760 280" className="h-full w-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="task-control-area-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#111827" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#111827" stopOpacity="0.04" />
              </linearGradient>
            </defs>

            {[0, 1, 2, 3].map((line) => {
              const y = 26 + line * 58;
              return (
                <line
                  key={line}
                  x1="34"
                  x2="736"
                  y1={y}
                  y2={y}
                  stroke="#e7e5e4"
                  strokeDasharray="4 6"
                />
              );
            })}

            <path d={chartGeometry.areaPath} fill="url(#task-control-area-fill)" />
            <path d={chartGeometry.linePath} fill="none" stroke="#111827" strokeWidth="3" strokeLinejoin="round" />

            {chartGeometry.points.map((point) => (
              <g key={point.id}>
                <circle cx={point.x} cy={point.y} r="4.5" fill="#ffffff" stroke="#111827" strokeWidth="2" />
                {point.value > 0 ? (
                  <text
                    x={point.x}
                    y={point.y - 12}
                    textAnchor="middle"
                    className="fill-muted-foreground"
                    style={{ fontSize: "12px" }}
                  >
                    {point.value}
                  </text>
                ) : null}
              </g>
            ))}
          </svg>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 grid grid-cols-6 gap-2 px-1">
            {chartDays
              .filter((_, index) => index % 3 === 0 || index === chartDays.length - 1)
              .map((day) => (
                <div key={day.id} className="text-[0.74rem] text-muted-foreground">
                  {day.label}
                </div>
              ))}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[1rem] border border-border bg-secondary/20 px-3.5 py-3">
            <p className="text-[0.76rem] uppercase tracking-[0.12em] text-muted-foreground">Peak</p>
            <p className="mt-2 font-display text-[1.5rem] font-medium tracking-tight text-foreground">
              {chartGeometry.peakPoint?.value ?? 0}
            </p>
            <p className="mt-1 text-[0.84rem] text-muted-foreground">
              {chartGeometry.peakPoint ? chartGeometry.peakPoint.label : "No due date data"}
            </p>
          </div>
          <div className="rounded-[1rem] border border-border bg-secondary/20 px-3.5 py-3">
            <p className="text-[0.76rem] uppercase tracking-[0.12em] text-muted-foreground">Dated tasks</p>
            <p className="mt-2 font-display text-[1.5rem] font-medium tracking-tight text-foreground">
              {chartDays.reduce((sum, day) => sum + day.value, 0)}
            </p>
            <p className="mt-1 text-[0.84rem] text-muted-foreground">Visible along this curve</p>
          </div>
          <div className="rounded-[1rem] border border-violet-200 bg-violet-50/80 px-3.5 py-3">
            <p className="text-[0.76rem] uppercase tracking-[0.12em] text-violet-700">No deadline</p>
            <p className="mt-2 font-display text-[1.5rem] font-medium tracking-tight text-violet-900">
              {noDateCount}
            </p>
            <p className="mt-1 text-[0.84rem] text-violet-700">Separate from dated workload</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskControlItemCard({
  item,
  compact = false,
}: {
  item: TaskControlRecord;
  compact?: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={cn(
        "group block rounded-[1.05rem] border border-border bg-background/80 transition-all hover:-translate-y-0.5 hover:border-foreground/40 hover:bg-background",
        compact ? "px-3 py-3" : "px-4 py-3.5",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[0.92rem] font-semibold leading-5 text-foreground">
            {item.title}
          </p>
          <p className="mt-1 text-[0.82rem] text-muted-foreground">{item.detail}</p>
          <p className="mt-1 text-[0.78rem] text-muted-foreground">{item.supportingText}</p>
        </div>

        <div className="shrink-0 text-right">
          <span
            className={cn(
              "inline-flex rounded-full border px-2.5 py-1 text-[0.7rem] font-medium",
              taskControlStageClassNames[item.stage],
            )}
          >
            {getTaskControlStageLabel(item.stage)}
          </span>
          <p className="mt-2 text-[0.76rem] text-muted-foreground">
            {item.dueDate ? formatDueDate(item.dueDate) : "No due date"}
          </p>
        </div>
      </div>
    </Link>
  );
}

function TaskControlSortButton({
  label,
  sortKey,
  activeKey,
  direction,
  align = "start",
  onClick,
}: {
  label: string;
  sortKey: TaskControlSortKey;
  activeKey: TaskControlSortKey;
  direction: SortDirection;
  align?: "start" | "end";
  onClick: (key: TaskControlSortKey) => void;
}) {
  const isActive = activeKey === sortKey;

  return (
    <button
      type="button"
      onClick={() => onClick(sortKey)}
      className={cn(
        "inline-flex items-center gap-2 text-left transition-colors hover:text-foreground",
        align === "end" && "justify-end",
      )}
    >
      <span>{label}</span>
      {isActive ? (
        direction === "asc" ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />
      ) : (
        <ArrowUpDown className="size-3.5 opacity-70" />
      )}
    </button>
  );
}

function TaskControlEmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-[1.35rem] border border-dashed border-border bg-secondary/20 px-4 py-5 text-[0.92rem] text-muted-foreground">
      {label}
    </div>
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

function getTaskControlStage(
  value: string | null,
  todayStart: number,
  sevenDayWindowEnd: number,
): TaskControlStage {
  if (isOverdue(value, todayStart)) return "overdue";
  if (isDueToday(value, todayStart)) return "today";
  if (isDueBetween(value, todayStart + DAY_MS, sevenDayWindowEnd)) return "soon";
  if (value) return "later";
  return "none";
}

function compareTaskControlRecords(a: TaskControlRecord, b: TaskControlRecord) {
  const stageRank: Record<TaskControlStage, number> = {
    overdue: 0,
    today: 1,
    soon: 2,
    later: 3,
    none: 4,
  };

  if (stageRank[a.stage] !== stageRank[b.stage]) {
    return stageRank[a.stage] - stageRank[b.stage];
  }

  const aDueDay = getDueDay(a.dueDate);
  const bDueDay = getDueDay(b.dueDate);

  if (aDueDay !== null && bDueDay !== null && aDueDay !== bDueDay) {
    return aDueDay - bDueDay;
  }

  if (aDueDay !== null && bDueDay === null) return -1;
  if (aDueDay === null && bDueDay !== null) return 1;

  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

function getTaskControlStageLabel(stage: TaskControlStage) {
  switch (stage) {
    case "overdue":
      return "Overdue";
    case "today":
      return "Due Today";
    case "soon":
      return "Next 7 Days";
    case "later":
      return "Later";
    case "none":
      return "No Deadline";
  }
}

function getTaskControlStageForKey(key: string | null, todayStart: number): TaskControlStage {
  if (!key || key === "none") return "none";

  const dueDay = Number(key);
  if (Number.isNaN(dueDay)) return "none";
  if (dueDay < todayStart) return "overdue";
  if (dueDay === todayStart) return "today";
  if (dueDay <= todayStart + DAY_MS * 7) return "soon";
  return "later";
}

function toggleTaskControlSort(
  nextKey: TaskControlSortKey,
  currentKey: TaskControlSortKey,
  currentDirection: SortDirection,
  setSortKey: (value: TaskControlSortKey) => void,
  setSortDirection: (value: SortDirection) => void,
) {
  if (nextKey === currentKey) {
    setSortDirection(currentDirection === "asc" ? "desc" : "asc");
    return;
  }

  setSortKey(nextKey);
  setSortDirection(nextKey === "due" ? "asc" : "desc");
}

function sortTaskControlItems(
  items: TaskControlRecord[],
  sortKey: TaskControlSortKey,
  direction: SortDirection,
) {
  const sorted = [...items];

  sorted.sort((a, b) => {
    let comparison = 0;

    switch (sortKey) {
      case "title":
        comparison = a.title.localeCompare(b.title, "th");
        break;
      case "scope":
        comparison = `${a.detail} ${a.supportingText}`.localeCompare(`${b.detail} ${b.supportingText}`, "th");
        break;
      case "due": {
        const aDue = getDueDay(a.dueDate);
        const bDue = getDueDay(b.dueDate);
        comparison =
          aDue === null && bDue === null
            ? 0
            : aDue === null
              ? 1
              : bDue === null
                ? -1
                : aDue - bDue;
        break;
      }
      case "priority":
        comparison = a.priorityRank - b.priorityRank;
        break;
    }

    if (comparison === 0) {
      comparison = compareTaskControlRecords(a, b);
    }

    return direction === "asc" ? comparison : comparison * -1;
  });

  return sorted;
}

function getPriorityRank(priority: "low" | "medium" | "high") {
  switch (priority) {
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
  }
}

function formatTaskControlContext(context: GtdItem["context"]) {
  return context ? `@${context}` : "No context";
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

function formatFullDate(value: number) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
}

function parseDateInput(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }

  return new Date(value);
}

function getMonthStart(value: number) {
  const date = new Date(value);
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function shiftMonth(value: number, amount: number) {
  const date = new Date(value);
  date.setMonth(date.getMonth() + amount);
  return getMonthStart(date.getTime());
}

function formatMonthHeading(value: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(value);
}

function buildCalendarDays(monthStart: number) {
  const month = new Date(monthStart).getMonth();
  const startDate = new Date(monthStart);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    date.setHours(0, 0, 0, 0);

    return {
      id: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
      time: date.getTime(),
      label: date.getDate().toString(),
      month: date.getMonth(),
      isCurrentMonth: date.getMonth() === month,
    };
  });
}

function buildAreaChartGeometry(
  days: Array<{ id: string; value: number; label: string }>,
  max: number,
) {
  const left = 34;
  const right = 736;
  const top = 26;
  const bottom = 234;
  const width = right - left;
  const height = bottom - top;
  const safeMax = Math.max(max, 1);

  const points = days.map((day, index) => {
    const x = left + (width / Math.max(days.length - 1, 1)) * index;
    const y = bottom - (day.value / safeMax) * height;
    return {
      id: day.id,
      label: day.label,
      value: day.value,
      x,
      y,
    };
  });

  const linePath = points.length
    ? `M ${points.map((point) => `${point.x} ${point.y}`).join(" L ")}`
    : "";
  const areaPath = points.length
    ? `M ${points[0]?.x} ${bottom} L ${points.map((point) => `${point.x} ${point.y}`).join(" L ")} L ${points[points.length - 1]?.x} ${bottom} Z`
    : "";
  const peakPoint = [...points].sort((a, b) => b.value - a.value)[0] ?? null;

  return {
    points,
    linePath,
    areaPath,
    peakPoint,
  };
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
