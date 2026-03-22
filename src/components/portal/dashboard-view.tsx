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
        className="h-10 appearance-none rounded-full border border-border bg-background pl-4 pr-10 text-sm font-medium text-foreground transition-all duration-300 ease-out hover:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
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
  const [clientRoomStatus, setClientRoomStatus] = useState("กำลังดึงข้อมูล client rooms...");
  const [gtdItems, setGtdItems] = useState<GtdItem[]>([]);
  const [trackerWorkspace, setTrackerWorkspace] = useState<TrackerWorkspaceData | null>(null);
  const [trackerStatus, setTrackerStatus] = useState("กำลังดึงข้อมูล Kanban board...");
  const [reviewStatus, setReviewStatus] = useState(getWeeklyReviewStatus(null));
  const [referenceTime, setReferenceTime] = useState(() => Date.now());

  useEffect(() => {
    let ignore = false;

    async function loadWorkspace() {
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

  return (
    <div ref={containerRef} className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-[10px]">
        <div className="mx-auto flex max-w-[1320px] items-center gap-4 px-6 py-5 lg:px-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-bnj.svg"
            alt="BNJ Studio"
            width={120}
            height={60}
            className="h-10 w-auto shrink-0"
          />
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold tracking-tight">
              AEC Workflow Platform
            </p>
            <p className="caption-editorial text-xs">Dashboard</p>
          </div>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
            <Link
              href="/aec-workflow"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
            >
              <BookOpenText className="size-4" />
              User Manual
            </Link>
            <Link
              href="/gtd"
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
            >
              <ListChecks className="size-4" />
              GTD Workspace
            </Link>
            <Link
              href="/todos"
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
            >
              <ListTodo className="size-4" />
              Kanban Board
            </Link>
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
            >
              <Settings2 className="size-4" />
              Settings & Export
            </Link>
            <Link
              href="/client-rooms"
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
            >
              <FolderOpen className="size-4" />
              Client Rooms CMS
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1320px] space-y-16 px-6 py-12 lg:px-10">
        <section className="fade-up space-y-6">
          <div className="max-w-4xl">
            <p className="caption-editorial mb-2">Dashboard</p>
            <h1 className="font-display text-4xl font-medium tracking-tight sm:text-5xl">
              หน้าเดียวเห็น GTD, Kanban, upcoming และ AI focus
            </h1>
            <p className="mt-4 text-base leading-8 text-muted-foreground">
              โครงสร้างหน้านี้ถูกปรับตามคู่มือผู้ใช้: เริ่มจากดู GTD stats,
              สถานะรวมของ board, deadline ที่กำลังจะถึง และสรุปสั้น ๆ
              ว่าสัปดาห์นี้ควรโฟกัสอะไร
            </p>
          </div>

          <div
            className={cn(
              "rounded-[1.75rem] border px-5 py-4",
              reviewStatus.tone === "good" &&
                "border-emerald-200 bg-emerald-50 text-emerald-800",
              reviewStatus.tone === "warning" &&
                "border-amber-200 bg-amber-50 text-amber-800",
              reviewStatus.tone === "danger" &&
                "border-rose-200 bg-rose-50 text-rose-800",
            )}
          >
            <p className="text-sm font-semibold">{reviewStatus.title}</p>
            <p className="mt-1 text-sm leading-7">{reviewStatus.body}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.12em] opacity-80">
              {reviewStatus.action}
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            <CommandCard
              icon={<ListChecks className="size-4" />}
              label="GTD Stats"
              title={`${gtdCounts.inbox} inbox · ${gtdCounts.next} next · ${gtdCounts.waiting} waiting`}
              body={`Stale waiting ${staleWaitingCount} รายการ และ weekly review ตอนนี้ "${reviewStatus.title}"`}
            />
            <CommandCard
              icon={<ClipboardList className="size-4" />}
              label="Kanban Overview"
              title={`${trackerWorkspace?.projects.length ?? 0} projects · ${trackerTasks.length} tasks`}
              body={
                trackerWorkspace
                  ? `${blockedTaskCount} blocked · ${waitingTaskCount} waiting · ${openReviewCount} pending review`
                  : trackerStatus
              }
            />
            <CommandCard
              icon={<CalendarClock className="size-4" />}
              label="Upcoming"
              title={`${trackerOverdueCount} overdue · ${trackerUpcomingCount + gtdUpcomingCount} due soon`}
              body="รวม deadline จาก GTD และ Kanban board เพื่อให้เห็นงานเสี่ยงก่อนเริ่มวัน"
            />
            <CommandCard
              icon={<BrainCircuit className="size-4" />}
              label="AI Insights"
              title="Suggested focus"
              body={aiInsight}
            />
          </div>
        </section>

        <section className="fade-up space-y-6">
          <div>
            <p className="caption-editorial mb-2">Quick Launch</p>
            <h2 className="font-display text-3xl font-medium tracking-tight">
              5 frameworks ใน workflow เดียว
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {manualFrameworkCards.map((framework) => (
              <article
                key={framework.name}
                className="rounded-[1.5rem] border border-border bg-background p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="caption-editorial text-[0.68rem]">{framework.name}</p>
                  <span
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium",
                      framework.status === "available" &&
                        "border-emerald-200 bg-emerald-50 text-emerald-700",
                      framework.status === "partial" &&
                        "border-amber-200 bg-amber-50 text-amber-700",
                      framework.status === "planned" &&
                        "border-border bg-background text-muted-foreground",
                    )}
                  >
                    {framework.status}
                  </span>
                </div>
                <p className="mt-3 text-sm font-medium text-foreground">{framework.role}</p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {framework.whenToUse}
                </p>
                <div className="mt-4">
                  {framework.href ? (
                    <Link
                      href={framework.href}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                    >
                      {framework.actionLabel}
                    </Link>
                  ) : (
                    <span className="inline-flex rounded-full border border-dashed border-border px-4 py-2 text-sm text-muted-foreground">
                      Planned module
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="fade-up space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricSummaryCard
              icon={<FolderOpen className="size-4" />}
              label="Active Projects"
              value={activeProjects}
              body="จำนวน client rooms ที่ถูกสร้างใน CMS ปัจจุบัน"
            />
            <MetricSummaryCard
              icon={<FileText className="size-4" />}
              label="Documents"
              value={totalDocuments}
              body="จำนวนเอกสาร draft ทั้งหมดที่ถูกใส่ไว้ใน CMS"
            />
            <MetricSummaryCard
              icon={<ClipboardList className="size-4" />}
              label="Need Publish"
              value={pendingPublishes}
              body="draft ที่ยังไม่เคย publish หรือมีข้อมูลใหม่กว่าลิงก์ลูกค้า"
            />
          </div>
        </section>

        <section className="fade-up space-y-6">
          <div>
            <p className="caption-editorial mb-2">Client Room Status</p>
            <h2 className="font-display text-3xl font-medium tracking-tight">
              ติดตามสถานะการเผยแพร่
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {(["draft", "dirty", "live"] as ClientRoomStatus[]).map((status, index) => (
              <div
                key={status}
                className={cn(
                  "fade-up rounded-lg border p-5",
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
                  <span className="ml-auto text-xs text-muted-foreground">
                    {clientRoomGroups[status].length}
                  </span>
                </div>

                <div className="space-y-3">
                  {clientRoomGroups[status].length === 0 ? (
                    <p className="py-6 text-center text-xs text-muted-foreground">
                      ไม่มีงาน
                    </p>
                  ) : null}

                  {clientRoomGroups[status].map((project) => (
                    <Link
                      key={project.id}
                      href={`/client-rooms?projectId=${project.id}`}
                      className={cn(
                        "block rounded-lg border bg-background p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)]",
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
                      <p className="mt-2 font-display text-base font-medium leading-tight">
                        {project.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {project.clientName}
                      </p>
                      <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
                        {getClientRoomStatusBody(project)}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="fade-up flex flex-wrap items-center gap-3">
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
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-medium text-muted-foreground transition-all duration-300 hover:border-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
              ล้าง filter
            </button>
          ) : null}
          <span className="text-sm text-muted-foreground">
            {filteredProjects.length} โปรเจกต์
          </span>
        </section>

        <section>
          <div className="fade-up mb-6">
            <p className="caption-editorial mb-2">Client Rooms</p>
            <h2 className="font-display text-3xl font-medium tracking-tight">
              จัดการและเปิดลิงก์แชร์
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {filteredProjects.length === 0 ? (
              <div className="col-span-full rounded-lg border border-border p-12 text-center">
                <p className="text-lg text-muted-foreground">
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
  title,
  body,
}: {
  icon: ReactNode;
  label: string;
  title: string;
  body: string;
}) {
  return (
    <article className="rounded-[1.75rem] border border-border bg-background p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="caption-editorial text-xs">{label}</span>
      </div>
      <h2 className="mt-3 font-display text-3xl font-medium tracking-tight">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">{body}</p>
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
  value: number;
  body: string;
}) {
  return (
    <article className="fade-up rounded-lg border border-border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
      <div className="mb-3 flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="caption-editorial text-xs">{label}</span>
      </div>
      <p className="font-display text-4xl font-medium">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </article>
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
        "fade-up group rounded-lg border border-border bg-background transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)]",
        delay,
      )}
    >
      <div className="p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
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

        <h3 className="font-display text-2xl font-medium tracking-tight">
          {project.title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {project.clientName} · {project.location || "ยังไม่ระบุที่ตั้ง"} · อัปเดต{" "}
          {formatPortalDate(project.updatedAt)}
        </p>

        <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {project.overview}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <span className="text-sm text-muted-foreground">
            {project.documentCount} files · {project.publishedAt ? "published" : "draft only"}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/client-rooms?projectId=${project.id}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-all duration-300 hover:bg-transparent hover:text-foreground hover:ring-1 hover:ring-foreground"
            >
              แก้ไขใน CMS
              <ArrowRight className="size-3.5" />
            </Link>
            {sharePath ? (
              <Link
                href={sharePath}
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
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
