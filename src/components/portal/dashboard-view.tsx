"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  BrainCircuit,
  CalendarClock,
  ClipboardList,
  FileText,
  FolderOpen,
  ListChecks,
  ListFilter,
  ListTodo,
  Settings2,
  X,
} from "lucide-react";

import { manualFrameworkCards } from "@/lib/aec-user-manual";
import { buildClientRoomSharePath, type ClientRoomProjectSummary } from "@/lib/client-rooms/types";
import {
  getBucketCounts,
  getWeeklyReviewStatus,
  type GtdItem,
} from "@/lib/gtd-system";
import { fetchGtdWorkspace } from "@/lib/gtd/client";
import {
  formatPortalDate,
  getProjectTypes,
} from "@/lib/portal-data";
import type { TrackerTaskRecord, TrackerWorkspaceData } from "@/lib/tracker/types";
import { cn } from "@/lib/utils";

const MONTH_LABELS: Record<number, string> = {
  0: "ม.ค.",
  1: "ก.พ.",
  2: "มี.ค.",
  3: "เม.ย.",
  4: "พ.ค.",
  5: "มิ.ย.",
  6: "ก.ค.",
  7: "ส.ค.",
  8: "ก.ย.",
  9: "ต.ค.",
  10: "พ.ย.",
  11: "ธ.ค.",
};

type ClientRoomStatus = "draft" | "dirty" | "live";

const clientRoomColumnStyles: Record<ClientRoomStatus, string> = {
  draft: "border-amber-200 bg-amber-50",
  dirty: "border-blue-200 bg-blue-50",
  live: "border-emerald-200 bg-emerald-50",
};

const clientRoomHeaderStyles: Record<ClientRoomStatus, string> = {
  draft: "text-amber-700",
  dirty: "text-blue-700",
  live: "text-emerald-700",
};

const clientRoomDotStyles: Record<ClientRoomStatus, string> = {
  draft: "bg-amber-500",
  dirty: "bg-blue-500",
  live: "bg-emerald-500",
};

const clientRoomCardStyles: Record<ClientRoomStatus, string> = {
  draft: "border-amber-200/70 hover:border-amber-300",
  dirty: "border-blue-200/70 hover:border-blue-300",
  live: "border-emerald-200/70 hover:border-emerald-300",
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

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 min-w-[8.8rem] appearance-none rounded-full border border-border bg-background pl-4 pr-10 text-[0.92rem] font-medium text-foreground transition-all duration-300 ease-out hover:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
      >
        <option value="all">{label}: ทั้งหมด</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ListFilter className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

export function DashboardView() {
  const containerRef = useScrollAnimation();

  const [typeFilter, setTypeFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [clientRoomProjects, setClientRoomProjects] = useState<ClientRoomProjectSummary[]>([]);
  const [isClientRoomsLoading, setIsClientRoomsLoading] = useState(true);
  const [clientRoomStatus, setClientRoomStatus] = useState("กำลังดึงข้อมูล client rooms...");
  const [gtdItems, setGtdItems] = useState<GtdItem[]>([]);
  const [trackerWorkspace, setTrackerWorkspace] = useState<TrackerWorkspaceData | null>(null);
  const [trackerStatus, setTrackerStatus] = useState("กำลังดึงข้อมูล Kanban board...");
  const [reviewStatus, setReviewStatus] = useState(getWeeklyReviewStatus(null));
  const [referenceTime, setReferenceTime] = useState(() => Date.now());

  useEffect(() => {
    let ignore = false;

    async function loadWorkspace() {
      setIsClientRoomsLoading(true);

      const [gtdResult, trackerResult, clientRoomResult] = await Promise.allSettled([
        fetchGtdWorkspace(),
        getTrackerWorkspace(),
        getClientRoomProjects(),
      ]);

      if (ignore) return;

      if (gtdResult.status === "fulfilled") {
        setGtdItems(gtdResult.value.items);
        setReviewStatus(getWeeklyReviewStatus(gtdResult.value.review.lastCompletedAt));
      }

      if (trackerResult.status === "fulfilled") {
        setTrackerWorkspace(trackerResult.value);
        setTrackerStatus("Kanban board พร้อมใช้งาน");
      } else {
        setTrackerWorkspace(null);
        setTrackerStatus(
          trackerResult.reason instanceof Error
            ? trackerResult.reason.message
            : "Tracker workspace unavailable.",
        );
      }

      if (clientRoomResult.status === "fulfilled") {
        setClientRoomProjects(clientRoomResult.value);
        setClientRoomStatus(
          clientRoomResult.value.length > 0
            ? "Client room CMS พร้อมใช้งาน"
            : "ยังไม่มี client room ในระบบ",
        );
      } else {
        setClientRoomProjects([]);
        setClientRoomStatus(
          clientRoomResult.reason instanceof Error
            ? clientRoomResult.reason.message
            : "Client room CMS unavailable.",
        );
      }

      setIsClientRoomsLoading(false);
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

  const availableYears = useMemo(
    () =>
      [...new Set(clientRoomProjects.map((project) => new Date(project.updatedAt).getFullYear()))].sort(
        (a, b) => b - a,
      ),
    [clientRoomProjects],
  );

  const availableMonths = useMemo(
    () =>
      [...new Set(clientRoomProjects.map((project) => new Date(project.updatedAt).getMonth()))].sort(
        (a, b) => a - b,
      ),
    [clientRoomProjects],
  );

  const filteredProjects = useMemo(
    () =>
      clientRoomProjects.filter((project) => {
        if (typeFilter !== "all" && project.projectType !== typeFilter) return false;
        const date = new Date(project.updatedAt);
        if (monthFilter !== "all" && String(date.getMonth()) !== monthFilter) return false;
        if (yearFilter !== "all" && String(date.getFullYear()) !== yearFilter) return false;
        return true;
      }),
    [clientRoomProjects, monthFilter, typeFilter, yearFilter],
  );

  const hasActiveFilters =
    typeFilter !== "all" || monthFilter !== "all" || yearFilter !== "all";
  const showClientRoomLoadingState =
    isClientRoomsLoading && clientRoomProjects.length === 0;

  const clearFilters = () => {
    setTypeFilter("all");
    setMonthFilter("all");
    setYearFilter("all");
  };

  const activeProjects = clientRoomProjects.length;
  const totalDocuments = clientRoomProjects.reduce(
    (count, project) => count + project.documentCount,
    0,
  );
  const pendingPublishes = clientRoomProjects.filter(
    (project) => getClientRoomStatus(project) !== "live",
  ).length;

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

  const gtdCounts = useMemo(() => getBucketCounts(gtdItems), [gtdItems]);
  const staleWaitingCount = useMemo(
    () =>
      gtdItems.filter(
        (item) =>
          item.bucket === "waiting" &&
          !item.done &&
          referenceTime - new Date(item.updatedAt).getTime() > 432000000,
      ).length,
    [gtdItems, referenceTime],
  );
  const gtdUpcomingCount = useMemo(
    () =>
      gtdItems.filter(
        (item) =>
          Boolean(item.dueDate) &&
          !item.done &&
          isDateWithinDays(item.dueDate as string, 7, referenceTime),
      ).length,
    [gtdItems, referenceTime],
  );

  const trackerTasks = useMemo(
    () => trackerWorkspace?.projects.flatMap((project) => project.tasks) ?? [],
    [trackerWorkspace],
  );
  const blockedTaskCount = trackerTasks.filter((task) => task.status === "blocked").length;
  const waitingTaskCount = trackerTasks.filter((task) => task.status === "waiting").length;
  const trackerOverdueCount = trackerTasks.filter((task) => isTrackerTaskOverdue(task, referenceTime)).length;
  const trackerUpcomingCount = trackerTasks.filter((task) => isTrackerTaskUpcoming(task, referenceTime)).length;
  const openReviewCount =
    trackerWorkspace?.reviewItems.filter((item) => item.status === "pending").length ?? 0;

  const aiInsight = useMemo(() => {
    if (reviewStatus.tone === "danger") return reviewStatus.action;
    if (reviewStatus.tone === "warning")
      return "กันเวลา Weekly Review ภายใน 24 ชั่วโมงเพื่อ reset focus ของสัปดาห์";
    if (blockedTaskCount > 0)
      return `มี ${blockedTaskCount} blocked task ที่ควร unblock ก่อนรับงานใหม่`;
    if (staleWaitingCount > 0)
      return `มี ${staleWaitingCount} waiting item ที่ควร follow up เพื่อกันงานตกหล่น`;
    if (trackerUpcomingCount + gtdUpcomingCount > 0)
      return `มี ${trackerUpcomingCount + gtdUpcomingCount} deadline ภายใน 7 วัน ควรปิดงานเสี่ยงก่อน`;
    return "Flow ตอนนี้นิ่ง ใช้เวลาใน platform สั้น ๆ แล้วกลับไป deep work ตาม routine";
  }, [
    blockedTaskCount,
    gtdUpcomingCount,
    reviewStatus.action,
    reviewStatus.tone,
    staleWaitingCount,
    trackerUpcomingCount,
  ]);

  const focusLabel =
    reviewStatus.tone === "danger"
      ? "ทำ Weekly Review ก่อน"
      : reviewStatus.tone === "warning"
        ? "ปิด Weekly Review วันนี้"
        : blockedTaskCount > 0
          ? "เคลียร์ blocked task"
          : "พร้อมกลับไป deep work";

  const followUpCount = staleWaitingCount + blockedTaskCount;

  const primaryActions: Array<{
    href: string;
    label: string;
    description: string;
    icon: ReactNode;
  }> = [
    {
      href: "/gtd",
      label: "เปิด GTD Workspace",
      description: "เคลียร์ inbox และเลือก next action ของวัน",
      icon: <ListChecks className="size-4" />,
    },
    {
      href: "/todos",
      label: "เช็ก Kanban Board",
      description: "ดู blocked, waiting และ pending review ของทีม",
      icon: <ListTodo className="size-4" />,
    },
    {
      href: "/client-rooms",
      label: "จัดการ Client Rooms",
      description: "อัปเดต CMS และเช็กลิงก์ที่พร้อมส่งลูกค้า",
      icon: <FolderOpen className="size-4" />,
    },
  ];

  const workspaceHighlights = [
    {
      label: "โฟกัสหลัก",
      value: focusLabel,
      detail: aiInsight,
    },
    {
      label: "งานที่ต้องตาม",
      value: `${followUpCount} รายการ`,
      detail:
        followUpCount > 0
          ? "รวม waiting ที่ค้างกับ blocked task ที่ควรตามต่อ"
          : "ยังไม่มีรายการที่ต้องเร่งติดตาม",
    },
    {
      label: "Client room ค้างส่ง",
      value: `${pendingPublishes} โปรเจกต์`,
      detail:
        pendingPublishes > 0
          ? "มี draft ที่ยังไม่ publish หรือมีข้อมูลใหม่กว่าลิงก์ลูกค้า"
          : "ลิงก์ลูกค้าทันสมัยและพร้อมแชร์",
    },
  ];

  const reviewBannerClassName = cn(
    "rounded-[1.5rem] border px-4 py-3.5 sm:px-5",
    reviewStatus.tone === "good" &&
      "border-emerald-200 bg-emerald-50 text-emerald-800",
    reviewStatus.tone === "warning" &&
      "border-amber-200 bg-amber-50 text-amber-800",
    reviewStatus.tone === "danger" &&
      "border-rose-200 bg-rose-50 text-rose-800",
  );

  return (
    <div ref={containerRef} className="min-h-screen">
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
              Dashboard รวมงานส่วนตัว งานทีม และ client rooms
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
            <Link
              href="/client-rooms"
              aria-label="Client Rooms CMS"
              className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-border px-3 text-[0.92rem] font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground sm:px-3.5"
            >
              <FolderOpen className="size-4" />
              <span className="hidden md:inline">Client Rooms CMS</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="space-y-8 px-4 py-5 sm:space-y-10 sm:px-6 sm:py-7 lg:space-y-12 lg:px-10 lg:py-8">
        <section className="fade-up grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.95fr)]">
          <div className="overflow-hidden rounded-[2rem] border border-border bg-[radial-gradient(circle_at_top_left,rgba(26,26,26,0.06),transparent_32%),linear-gradient(180deg,rgba(248,248,248,0.7),rgba(255,255,255,1))] p-5 sm:p-6">
            <div className="max-w-3xl">
              <p className="caption-editorial mb-2">Owner Dashboard</p>
              <h1 className="font-display text-[2rem] font-medium tracking-tight sm:text-[2.35rem] lg:text-[2.65rem]">
                เห็นงานสำคัญเร็วขึ้น และเข้าแต่ละระบบได้โดยไม่ต้องไล่หาเมนู
              </h1>
              <p className="mt-3 max-w-2xl text-[0.96rem] leading-6 text-muted-foreground">
                รวม GTD, Kanban, deadline และ client rooms ไว้ในลำดับที่สแกนง่ายกว่าเดิม
                เพื่อให้รู้ทันทีว่าต้องเริ่มจากอะไรและควรเข้า workspace ไหนต่อ
              </p>
            </div>

            <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
              {workspaceHighlights.map((highlight) => (
                <div
                  key={highlight.label}
                  className="rounded-[1.35rem] border border-border/80 bg-background/80 p-3.5 sm:p-4"
                >
                  <p className="caption-editorial text-[0.68rem]">{highlight.label}</p>
                  <p className="mt-2 text-[1.02rem] font-semibold tracking-tight text-foreground">
                    {highlight.value}
                  </p>
                  <p className="mt-1.5 text-[0.92rem] leading-6 text-muted-foreground">
                    {highlight.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-[2rem] border border-border bg-secondary/45 p-4 sm:p-5">
            <p className="caption-editorial mb-2.5">Quick Actions</p>
            <h2 className="font-display text-[1.7rem] font-medium tracking-tight sm:text-[1.95rem]">
              เปิด workspace ที่ใช้บ่อยได้ทันที
            </h2>
            <p className="mt-2.5 text-[0.94rem] leading-6 text-muted-foreground">
              เริ่มจากงานส่วนตัว, เช็กสถานะทีม, หรือกระโดดไปจัดการงานส่งลูกค้าได้จากจุดเดียว
            </p>

            <div className="mt-4 space-y-2.5">
              {primaryActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group flex items-start gap-3 rounded-[1.35rem] border border-border bg-background px-3.5 py-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/50 hover:shadow-[0_12px_30px_rgba(0,0,0,0.05)]"
                >
                  <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-foreground">
                    {action.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[0.98rem] font-semibold text-foreground">{action.label}</p>
                    <p className="mt-1 text-[0.92rem] leading-6 text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                  <ArrowRight className="ml-auto mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-foreground" />
                </Link>
              ))}
            </div>
          </aside>
        </section>

        <section className="fade-up space-y-4">
          <div className={reviewBannerClassName}>
            <p className="text-sm font-semibold">{reviewStatus.title}</p>
            <p className="mt-1 text-[0.94rem] leading-6">{reviewStatus.body}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.12em] opacity-80">
              {reviewStatus.action}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <CommandCard
              icon={<ListChecks className="size-4" />}
              label="GTD Stats"
              metric={`${gtdCounts.next} next action`}
              title={`${gtdCounts.inbox} inbox · ${gtdCounts.waiting} waiting`}
              body={`มี waiting ที่ค้าง ${staleWaitingCount} รายการ และ weekly review ตอนนี้อยู่ที่ "${reviewStatus.title}"`}
            />
            <CommandCard
              icon={<ClipboardList className="size-4" />}
              label="Kanban Overview"
              metric={`${trackerTasks.length} tasks`}
              title={`${trackerWorkspace?.projects.length ?? 0} projects · ${openReviewCount} pending review`}
              body={
                trackerWorkspace
                  ? `${blockedTaskCount} blocked · ${waitingTaskCount} waiting · พร้อมเช็กสถานะทั้งทีมได้จากหน้าเดียว`
                  : trackerStatus
              }
            />
            <CommandCard
              icon={<CalendarClock className="size-4" />}
              label="Upcoming"
              metric={`${trackerUpcomingCount + gtdUpcomingCount} due soon`}
              title={`${trackerOverdueCount} overdue task`}
              body="รวม deadline จาก GTD และ Kanban เพื่อให้เห็นงานเสี่ยงก่อนเริ่มวัน"
            />
            <CommandCard
              icon={<BrainCircuit className="size-4" />}
              label="AI Insights"
              metric={focusLabel}
              title="Suggested focus"
              body={aiInsight}
            />
          </div>
        </section>

        <section className="fade-up space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="caption-editorial mb-2">Quick Launch</p>
              <h2 className="font-display text-[1.75rem] font-medium tracking-tight sm:text-[2rem]">
                5 frameworks ใน workflow เดียว
              </h2>
            </div>
            <p className="max-w-2xl text-[0.94rem] leading-6 text-muted-foreground">
              มองเห็นแต่ละ framework แยกเป็นการ์ดชัดเจน เลือกเข้า workspace หรือคู่มือของแต่ละระบบได้เร็วขึ้น
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {manualFrameworkCards.map((framework, index) => (
              <article
                key={framework.name}
                className={cn(
                  "rounded-[1.5rem] border border-border bg-background p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(0,0,0,0.04)] sm:p-5",
                  index % 2 === 1 && "delay-100",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="caption-editorial mb-1 text-[0.68rem]">{framework.name}</p>
                    <p className="text-[0.98rem] font-semibold text-foreground">
                      {framework.role}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2.5 py-1 text-[0.74rem] font-medium",
                      framework.status === "available" &&
                        "border-emerald-200 bg-emerald-50 text-emerald-700",
                      framework.status === "partial" &&
                        "border-amber-200 bg-amber-50 text-amber-700",
                      framework.status === "planned" &&
                        "border-border bg-background text-muted-foreground",
                    )}
                  >
                    {framework.status === "available"
                      ? "พร้อมใช้"
                      : framework.status === "partial"
                        ? "พร้อมบางส่วน"
                        : "วางแผนไว้"}
                  </span>
                </div>

                <p className="mt-3 text-[0.92rem] leading-6 text-muted-foreground">
                  {framework.whenToUse}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {framework.href ? (
                    <Link
                      href={framework.href}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3.5 text-[0.92rem] font-medium text-foreground transition-colors hover:border-foreground hover:bg-secondary"
                    >
                      {framework.actionLabel}
                    </Link>
                  ) : null}

                  {framework.guideHref ? (
                    <Link
                      href={framework.guideHref}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[0.92rem] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      {framework.guideActionLabel ?? "Open guide"}
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="fade-up space-y-4">
          <div>
            <p className="caption-editorial mb-2">Client Rooms Overview</p>
            <h2 className="font-display text-[1.7rem] font-medium tracking-tight sm:text-[1.95rem]">
              เห็นงานที่กำลังทำและงานที่ต้อง publish ในมุมเดียว
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
            <MetricSummaryCard
              icon={<FolderOpen className="size-4" />}
              label="Active Projects"
              value={showClientRoomLoadingState ? <MetricValueSkeleton /> : activeProjects}
              body="จำนวน client rooms ที่ถูกสร้างใน CMS ปัจจุบัน"
            />
            <MetricSummaryCard
              icon={<FileText className="size-4" />}
              label="Documents"
              value={showClientRoomLoadingState ? <MetricValueSkeleton /> : totalDocuments}
              body="จำนวนเอกสาร draft ทั้งหมดที่ถูกใส่ไว้ใน CMS"
            />
            <MetricSummaryCard
              icon={<ClipboardList className="size-4" />}
              label="Need Publish"
              value={showClientRoomLoadingState ? <MetricValueSkeleton /> : pendingPublishes}
              body="draft ที่ยังไม่เคย publish หรือมีข้อมูลใหม่กว่าลิงก์ลูกค้า"
            />
          </div>
        </section>

        <section className="fade-up space-y-4">
          <div>
            <p className="caption-editorial mb-2">Client Room Status</p>
            <h2 className="font-display text-[1.7rem] font-medium tracking-tight sm:text-[1.95rem]">
              ติดตามสถานะการเผยแพร่
            </h2>
            <p className="mt-2 max-w-2xl text-[0.94rem] leading-6 text-muted-foreground">
              แยกงาน draft, งานที่มีการเปลี่ยนแปลงหลัง publish และงานที่ live แล้ว
              เพื่อให้รู้ว่าควรเข้าหน้าไหนก่อน
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-3">
            {(["draft", "dirty", "live"] as ClientRoomStatus[]).map((status, index) => (
              <div
                key={status}
                className={cn(
                  "fade-up rounded-[1.35rem] border p-4 sm:p-5",
                  index === 1 && "delay-100",
                  index === 2 && "delay-200",
                  clientRoomColumnStyles[status],
                )}
              >
                <div className="mb-5 flex items-center gap-2.5">
                  <span className={cn("size-2 rounded-full", clientRoomDotStyles[status])} />
                  <h3
                    className={cn(
                      "text-sm font-semibold uppercase tracking-widest",
                      clientRoomHeaderStyles[status],
                    )}
                  >
                    {getClientRoomStatusLabel(status)}
                  </h3>
                  {showClientRoomLoadingState ? (
                    <SkeletonBlock className="ml-auto h-3 w-8 rounded-full" />
                  ) : (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {clientRoomGroups[status].length}
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {showClientRoomLoadingState ? (
                    <>
                      <ClientRoomStatusCardSkeleton />
                      <ClientRoomStatusCardSkeleton />
                    </>
                  ) : clientRoomGroups[status].length === 0 ? (
                    <p className="py-6 text-center text-xs text-muted-foreground">
                      ไม่มีงาน
                    </p>
                  ) : null}

                  {clientRoomGroups[status].map((project) => (
                    <Link
                      key={project.id}
                      href={`/client-rooms?projectId=${project.id}`}
                      className={cn(
                        "block rounded-[1.2rem] border bg-background p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] sm:p-4",
                        clientRoomCardStyles[status],
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {project.slug}
                        </span>
                        <span className="caption-editorial text-[0.7rem]">
                          {project.projectType}
                        </span>
                      </div>
                      <p className="mt-2 font-display text-[1rem] font-medium leading-tight">
                        {project.title}
                      </p>
                      <p className="mt-1 text-[0.9rem] text-muted-foreground">
                        {project.clientName}
                      </p>
                      <p className="mt-2 text-[0.88rem] leading-5 text-muted-foreground">
                        {getClientRoomStatusBody(project)}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="fade-up space-y-3.5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="caption-editorial mb-2">Client Rooms</p>
              <h2 className="font-display text-[1.7rem] font-medium tracking-tight sm:text-[1.95rem]">
                จัดการและเปิดลิงก์แชร์
              </h2>
            </div>
            <p className="max-w-2xl text-[0.94rem] leading-6 text-muted-foreground">
              กรองตามประเภท เดือน และปี เพื่อหาโปรเจกต์ที่ต้องแก้ใน CMS หรือพร้อมเปิดลิงก์ลูกค้าได้เร็วขึ้น
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 rounded-[1.5rem] border border-border bg-secondary/30 p-3.5">
            <FilterSelect
              label="ประเภท"
              value={typeFilter}
              onChange={setTypeFilter}
              options={getProjectTypes().map((type) => ({ value: type, label: type }))}
            />
            <FilterSelect
              label="เดือน"
              value={monthFilter}
              onChange={setMonthFilter}
              options={availableMonths.map((month) => ({
                value: String(month),
                label: MONTH_LABELS[month] || String(month + 1),
              }))}
            />
            <FilterSelect
              label="ปี"
              value={yearFilter}
              onChange={setYearFilter}
              options={availableYears.map((year) => ({
                value: String(year),
                label: String(year),
              }))}
            />
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-background px-4 text-[0.92rem] font-medium text-muted-foreground transition-all duration-300 hover:border-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
                ล้าง filter
              </button>
            ) : null}
            {showClientRoomLoadingState ? (
              <SkeletonBlock className="h-4 w-24 rounded-full" />
            ) : (
              <span className="text-[0.92rem] text-muted-foreground">
                แสดง {filteredProjects.length} โปรเจกต์
              </span>
            )}
          </div>
        </section>

        <section>
          <div className="fade-up mb-5">
            <p className="caption-editorial mb-2">Client Rooms</p>
            <h3 className="font-display text-xl font-medium tracking-tight text-muted-foreground sm:text-2xl">
              รายการโปรเจกต์ล่าสุด
            </h3>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {showClientRoomLoadingState ? (
              <>
                <ProjectCardSkeleton />
                <ProjectCardSkeleton delay="delay-100" />
              </>
            ) : null}

            {!showClientRoomLoadingState && filteredProjects.length === 0 ? (
              <div className="col-span-full rounded-[1.5rem] border border-border p-10 text-center sm:p-12">
                <p className="text-base leading-7 text-muted-foreground">
                  {clientRoomProjects.length === 0
                    ? clientRoomStatus
                    : "ไม่พบโปรเจกต์ที่ตรงกับ filter"}
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-3 text-sm font-medium text-foreground underline underline-offset-4 transition-colors hover:text-muted-foreground"
                >
                  ล้าง filter ทั้งหมด
                </button>
              </div>
            ) : null}

            {filteredProjects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                delay={index % 2 === 0 ? "" : "delay-100"}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function CommandCard({
  icon,
  label,
  metric,
  title,
  body,
}: {
  icon: ReactNode;
  label: string;
  metric: string;
  title: string;
  body: string;
}) {
  return (
    <article className="rounded-[1.4rem] border border-border bg-background p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] sm:p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="caption-editorial text-xs">{label}</span>
      </div>
      <p className="mt-3 font-display text-[1.18rem] font-medium tracking-tight text-foreground sm:text-[1.35rem]">
        {metric}
      </p>
      <h2 className="mt-1.5 text-[0.92rem] font-semibold text-foreground">{title}</h2>
      <p className="mt-1.5 text-[0.9rem] leading-5 text-muted-foreground">{body}</p>
    </article>
  );
}

function MetricSummaryCard({
  icon,
  label,
  value,
  body,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  body: string;
}) {
  return (
    <article className="fade-up rounded-[1.4rem] border border-border bg-background p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] sm:p-5">
      <div className="mb-3 flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="caption-editorial text-xs">{label}</span>
      </div>
      <p className="font-display text-[1.85rem] font-medium tracking-tight sm:text-[1.95rem]">{value}</p>
      <p className="mt-2 text-[0.9rem] leading-5 text-muted-foreground">{body}</p>
    </article>
  );
}

function SkeletonBlock({ className }: { className: string }) {
  return <div aria-hidden className={cn("skeleton-shimmer", className)} />;
}

function MetricValueSkeleton() {
  return <SkeletonBlock className="h-10 w-28 rounded-lg" />;
}

function ClientRoomStatusCardSkeleton() {
  return (
    <div className="rounded-lg border border-white/40 bg-background/80 p-4">
      <div className="flex items-center gap-2">
        <SkeletonBlock className="h-3 w-28 rounded-full" />
        <SkeletonBlock className="h-3 w-16 rounded-full" />
      </div>
      <SkeletonBlock className="mt-4 h-6 w-3/4 rounded-lg" />
      <SkeletonBlock className="mt-2 h-3 w-1/2 rounded-full" />
      <SkeletonBlock className="mt-4 h-3 w-full rounded-full" />
      <SkeletonBlock className="mt-2 h-3 w-5/6 rounded-full" />
    </div>
  );
}

function ProjectCardSkeleton({ delay = "" }: { delay?: string }) {
  return (
    <div
      className={cn(
        "fade-up rounded-lg border border-border bg-background p-6",
        delay,
      )}
    >
      <SkeletonBlock className="mb-5 aspect-[16/9] w-full rounded-2xl" />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SkeletonBlock className="h-4 w-36 rounded-full" />
        <SkeletonBlock className="h-6 w-24 rounded-full" />
        <SkeletonBlock className="h-6 w-16 rounded-full" />
      </div>
      <SkeletonBlock className="h-8 w-2/3 rounded-lg" />
      <SkeletonBlock className="mt-3 h-4 w-5/6 rounded-full" />
      <SkeletonBlock className="mt-2 h-4 w-3/4 rounded-full" />
      <SkeletonBlock className="mt-6 h-4 w-full rounded-full" />
      <SkeletonBlock className="mt-2 h-4 w-4/5 rounded-full" />
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <SkeletonBlock className="h-4 w-32 rounded-full" />
        <div className="flex flex-wrap items-center gap-2">
          <SkeletonBlock className="h-10 w-28 rounded-full" />
          <SkeletonBlock className="h-10 w-28 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  delay,
}: {
  project: ClientRoomProjectSummary;
  delay: string;
}) {
  const status = getClientRoomStatus(project);
  const sharePath =
    project.shareToken && project.publishedAt
      ? buildClientRoomSharePath(project.shareToken)
      : null;

  return (
    <div
      className={cn(
        "fade-up group rounded-[1.4rem] border border-border bg-background transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)]",
        delay,
      )}
    >
      <div className="p-4 sm:p-5">
        <div className="overflow-hidden rounded-2xl border border-border bg-secondary/30">
          {project.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.thumbnailUrl}
              alt={project.title}
              className="aspect-video max-h-56 w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="flex aspect-video max-h-56 items-center justify-center text-sm text-muted-foreground">
              ยังไม่มีรูปโปรเจกต์
            </div>
          )}
        </div>

        <div className="mt-4 mb-3 flex flex-wrap items-center gap-2">
          <span className="caption-editorial text-xs">{project.slug}</span>
          <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium">
            {project.projectType}
          </span>
          <span
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xs font-medium",
              status === "draft" && "border-amber-200 bg-amber-50 text-amber-700",
              status === "dirty" && "border-blue-200 bg-blue-50 text-blue-700",
              status === "live" && "border-emerald-200 bg-emerald-50 text-emerald-700",
            )}
          >
            {getClientRoomStatusLabel(status)}
          </span>
        </div>

        <h3 className="font-display text-[1.1rem] font-medium tracking-tight sm:text-[1.25rem]">
          {project.title}
        </h3>
        <p className="mt-1 text-[0.9rem] leading-5 text-muted-foreground">
          {project.clientName} · {project.location || "ยังไม่ระบุที่ตั้ง"} · อัปเดต{" "}
          {formatPortalDate(project.updatedAt)}
        </p>

        <p className="mt-3 line-clamp-2 text-[0.9rem] leading-5 text-muted-foreground">
          {project.overview}
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3.5">
          <span className="text-[0.9rem] leading-5 text-muted-foreground">
            {project.documentCount} files · {project.publishedAt ? "published" : "draft only"}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/client-rooms?projectId=${project.id}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground px-4 text-[0.92rem] font-medium text-background transition-all duration-300 hover:bg-transparent hover:text-foreground hover:ring-1 hover:ring-foreground"
            >
              แก้ไขใน CMS
              <ArrowRight className="size-3.5" />
            </Link>
            {sharePath ? (
              <Link
                href={sharePath}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-4 text-[0.92rem] font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
              >
                เปิดลิงก์ลูกค้า
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
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
      return "Draft Only";
    case "dirty":
      return "Unpublished Changes";
    case "live":
      return "Live";
  }
}

function getClientRoomStatusBody(project: ClientRoomProjectSummary) {
  const status = getClientRoomStatus(project);

  switch (status) {
    case "draft":
      return "ยังไม่เคย publish ลิงก์ลูกค้า";
    case "dirty":
      return "มี draft ใหม่กว่าลิงก์ลูกค้า กด publish อีกครั้งเมื่อพร้อม";
    case "live":
      return `เผยแพร่ล่าสุด ${project.publishedAt ? formatPortalDate(project.publishedAt) : "-"}`;
  }
}

function isDateWithinDays(value: string, days: number, referenceTime: number) {
  const date = new Date(value);
  const diff = date.getTime() - referenceTime;
  return diff >= 0 && diff <= days * 86400000;
}

function isTrackerTaskOverdue(task: TrackerTaskRecord, referenceTime: number) {
  if (!task.dueDate || task.status === "done") return false;
  return new Date(task.dueDate).getTime() < referenceTime;
}

function isTrackerTaskUpcoming(task: TrackerTaskRecord, referenceTime: number) {
  if (!task.dueDate || task.status === "done") return false;
  return isDateWithinDays(task.dueDate, 7, referenceTime);
}

async function getTrackerWorkspace(): Promise<TrackerWorkspaceData> {
  const response = await fetch("/api/tracker/workspace", { cache: "no-store" });
  const data = (await response.json()) as { error?: string; workspace?: TrackerWorkspaceData };

  if (!response.ok || !data.workspace) {
    throw new Error(data.error || "Tracker workspace unavailable.");
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
    throw new Error(data.error || "Client rooms unavailable.");
  }

  return data.projects;
}
