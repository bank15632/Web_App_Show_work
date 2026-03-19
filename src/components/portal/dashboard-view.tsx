"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  FileText,
  FolderOpen,
  ListFilter,
  ListTodo,
  X,
} from "lucide-react";

import { ProjectStageBadge } from "@/components/portal/project-stage-badge";
import {
  type ClientProject,
  type RevisionStatus,
  formatPortalDate,
  getProjectDocumentCount,
  getProjectTypes,
  getProjects,
  getRevisionStatusLabel,
} from "@/lib/portal-data";

/* ── BNJ-style constants ─────────────────────────────── */

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

const revisionColumnStyles: Record<RevisionStatus, string> = {
  todo: "border-amber-200 bg-amber-50",
  doing: "border-blue-200 bg-blue-50",
  done: "border-emerald-200 bg-emerald-50",
};

const revisionHeaderStyles: Record<RevisionStatus, string> = {
  todo: "text-amber-700",
  doing: "text-blue-700",
  done: "text-emerald-700",
};

const revisionDotStyles: Record<RevisionStatus, string> = {
  todo: "bg-amber-500",
  doing: "bg-blue-500",
  done: "bg-emerald-500",
};

const revisionCardStyles: Record<RevisionStatus, string> = {
  todo: "border-amber-200/70 hover:border-amber-300",
  doing: "border-blue-200/70 hover:border-blue-300",
  done: "border-emerald-200/70 hover:border-emerald-300",
};

/* ── Scroll Animation Hook ───────────────────────────── */

function useScrollAnimation() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const elements = container.querySelectorAll(".fade-up");
    if (elements.length === 0) return;

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

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return ref;
}

/* ── Filter Select ───────────────────────────────────── */

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 appearance-none rounded-full border border-border bg-background pl-4 pr-10 text-sm font-medium text-foreground transition-all duration-300 ease-out hover:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
      >
        <option value="all">{label}: ทั้งหมด</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ListFilter className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

/* ── Main Dashboard ──────────────────────────────────── */

export function DashboardView() {
  const projects = getProjects();
  const containerRef = useScrollAnimation();

  const [typeFilter, setTypeFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");

  const availableYears = useMemo(() => {
    return [
      ...new Set(projects.map((p) => new Date(p.updatedAt).getFullYear())),
    ].sort((a, b) => b - a);
  }, [projects]);

  const availableMonths = useMemo(() => {
    return [
      ...new Set(projects.map((p) => new Date(p.updatedAt).getMonth())),
    ].sort((a, b) => a - b);
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (typeFilter !== "all" && p.projectType !== typeFilter) return false;
      const date = new Date(p.updatedAt);
      if (monthFilter !== "all" && String(date.getMonth()) !== monthFilter)
        return false;
      if (yearFilter !== "all" && String(date.getFullYear()) !== yearFilter)
        return false;
      return true;
    });
  }, [projects, typeFilter, monthFilter, yearFilter]);

  const hasActiveFilters =
    typeFilter !== "all" || monthFilter !== "all" || yearFilter !== "all";

  const clearFilters = () => {
    setTypeFilter("all");
    setMonthFilter("all");
    setYearFilter("all");
  };

  const activeProjects = projects.filter((p) => p.stage !== "archived");
  const totalDocuments = projects.reduce(
    (count, p) => count + getProjectDocumentCount(p),
    0,
  );
  const pendingRevisions = projects.filter(
    (p) => p.revisionStatus !== "done",
  ).length;

  const taskGroups = useMemo(() => {
    const groups: Record<RevisionStatus, ClientProject[]> = {
      todo: [],
      doing: [],
      done: [],
    };
    for (const p of projects) {
      groups[p.revisionStatus].push(p);
    }
    return groups;
  }, [projects]);

  return (
    <div ref={containerRef} className="min-h-screen">
      {/* Header - BNJ style: white bg, blur, border-bottom */}
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
              Client Rooms
            </p>
            <p className="caption-editorial text-xs">Owner Dashboard</p>
          </div>
          <Link
            href="/todos"
            className="ml-auto inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            <ListTodo className="size-4" />
            AI Project Tracker
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1320px] space-y-16 px-6 py-12 lg:px-10">
        {/* Hero Stats - BNJ editorial style */}
        <section className="fade-up space-y-6">
          <div>
            <p className="caption-editorial mb-2">Overview</p>
            <h1 className="font-display text-4xl font-medium tracking-tight sm:text-5xl">
              โปรเจกต์ทั้งหมด
            </h1>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="fade-up rounded-lg border border-border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
              <div className="mb-3 flex items-center gap-2 text-muted-foreground">
                <FolderOpen className="size-4" />
                <span className="caption-editorial text-xs">Active Projects</span>
              </div>
              <p className="font-display text-4xl font-medium">
                {activeProjects.length}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                โปรเจกต์ที่อยู่ใน concept, revision หรือ construction
              </p>
            </div>

            <div className="fade-up delay-100 rounded-lg border border-border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
              <div className="mb-3 flex items-center gap-2 text-muted-foreground">
                <FileText className="size-4" />
                <span className="caption-editorial text-xs">Documents</span>
              </div>
              <p className="font-display text-4xl font-medium">
                {totalDocuments}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                ไฟล์ทั้งหมดรวม Canva, PDF และ revision archives
              </p>
            </div>

            <div className="fade-up delay-200 rounded-lg border border-border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
              <div className="mb-3 flex items-center gap-2 text-muted-foreground">
                <ClipboardList className="size-4" />
                <span className="caption-editorial text-xs">Pending Revisions</span>
              </div>
              <p className="font-display text-4xl font-medium">
                {pendingRevisions}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                งานที่ต้อง revise (Todo + Doing)
              </p>
            </div>
          </div>
        </section>

        {/* Task Board - Colored columns */}
        <section className="fade-up space-y-6">
          <div>
            <p className="caption-editorial mb-2">Revision Tasks</p>
            <h2 className="font-display text-3xl font-medium tracking-tight">
              ติดตามสถานะงาน Revise
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {(["todo", "doing", "done"] as RevisionStatus[]).map(
              (status, colIdx) => (
                <div
                  key={status}
                  className={`fade-up ${colIdx === 1 ? "delay-100" : colIdx === 2 ? "delay-200" : ""} rounded-lg border p-5 ${revisionColumnStyles[status]}`}
                >
                  <div className="mb-5 flex items-center gap-2.5">
                    <span
                      className={`size-2 rounded-full ${revisionDotStyles[status]}`}
                    />
                    <h3
                      className={`text-sm font-semibold uppercase tracking-widest ${revisionHeaderStyles[status]}`}
                    >
                      {getRevisionStatusLabel(status)}
                    </h3>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {taskGroups[status].length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {taskGroups[status].length === 0 && (
                      <p className="py-6 text-center text-xs text-muted-foreground">
                        ไม่มีงาน
                      </p>
                    )}
                    {taskGroups[status].map((project) => (
                      <Link
                        key={project.slug}
                        href={`/p/${project.slug}`}
                        className={`block rounded-lg border bg-background p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] ${revisionCardStyles[status]}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            {project.code}
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
                          {project.nextMilestone}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              ),
            )}
          </div>
        </section>

        {/* Filters - BNJ pill style */}
        <section className="fade-up flex flex-wrap items-center gap-3">
          <FilterSelect
            label="ประเภท"
            value={typeFilter}
            onChange={setTypeFilter}
            options={getProjectTypes().map((t) => ({ value: t, label: t }))}
          />
          <FilterSelect
            label="เดือน"
            value={monthFilter}
            onChange={setMonthFilter}
            options={availableMonths.map((m) => ({
              value: String(m),
              label: MONTH_LABELS[m] || String(m + 1),
            }))}
          />
          <FilterSelect
            label="ปี"
            value={yearFilter}
            onChange={setYearFilter}
            options={availableYears.map((y) => ({
              value: String(y),
              label: String(y),
            }))}
          />
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-medium text-muted-foreground transition-all duration-300 hover:border-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
              ล้าง filter
            </button>
          )}
          <span className="text-sm text-muted-foreground">
            {filteredProjects.length} โปรเจกต์
          </span>
        </section>

        {/* Project Grid - BNJ card style */}
        <section>
          <div className="fade-up mb-6">
            <p className="caption-editorial mb-2">Projects</p>
            <h2 className="font-display text-3xl font-medium tracking-tight">
              เลือกเปิดหน้าลูกค้า
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {filteredProjects.length === 0 && (
              <div className="col-span-full rounded-lg border border-border p-12 text-center">
                <p className="text-lg text-muted-foreground">
                  ไม่พบโปรเจกต์ที่ตรงกับ filter
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-3 text-sm font-medium text-foreground underline underline-offset-4 transition-colors hover:text-muted-foreground"
                >
                  ล้าง filter ทั้งหมด
                </button>
              </div>
            )}
            {filteredProjects.map((project, i) => (
              <ProjectCard
                key={project.slug}
                project={project}
                delay={i % 2 === 0 ? "" : "delay-100"}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

/* ── Project Card ────────────────────────────────────── */

function ProjectCard({
  project,
  delay,
}: {
  project: ClientProject;
  delay: string;
}) {
  return (
    <div
      className={`fade-up ${delay} group rounded-lg border border-border bg-background transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)]`}
    >
      <div className="p-6">
        {/* Badges row */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="caption-editorial text-xs">{project.code}</span>
          <span className="text-muted-foreground">·</span>
          <ProjectStageBadge stage={project.stage} />
          <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium">
            {project.projectType}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-display text-2xl font-medium tracking-tight">
          {project.title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {project.clientName} · {project.location} · อัปเดต{" "}
          {formatPortalDate(project.updatedAt)}
        </p>

        {/* Overview */}
        <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {project.overview}
        </p>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <span className="text-sm text-muted-foreground">
            {getProjectDocumentCount(project)} files · {project.viewerCount}{" "}
            viewers
          </span>
          <Link
            href={`/p/${project.slug}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-all duration-300 hover:bg-transparent hover:text-foreground hover:ring-1 hover:ring-foreground"
          >
            เปิดหน้าลูกค้า
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
