"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  FileText,
  FolderOpen,
  ListFilter,
  X,
} from "lucide-react";

import { ProjectStageBadge } from "@/components/portal/project-stage-badge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ClientProject,
  type ProjectType,
  type RevisionStatus,
  formatPortalDate,
  getProjectDocumentCount,
  getProjectTypes,
  getProjects,
  getRevisionStatusLabel,
} from "@/lib/portal-data";
import { secondaryLinkClass } from "@/lib/portal-styles";

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

const typeColorMap: Record<ProjectType, string> = {
  House: "bg-amber-100 text-amber-800",
  Condo: "bg-blue-100 text-blue-800",
  Commercial: "bg-violet-100 text-violet-800",
};

const revisionColumnStyles: Record<RevisionStatus, string> = {
  todo: "border-orange-200 bg-orange-50/50",
  doing: "border-blue-200 bg-blue-50/50",
  done: "border-emerald-200 bg-emerald-50/50",
};

const revisionHeaderStyles: Record<RevisionStatus, string> = {
  todo: "text-orange-700",
  doing: "text-blue-700",
  done: "text-emerald-700",
};

const revisionDotStyles: Record<RevisionStatus, string> = {
  todo: "bg-orange-400",
  doing: "bg-blue-400",
  done: "bg-emerald-400",
};

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
        className="h-10 appearance-none rounded-full border border-border bg-background pl-4 pr-10 text-sm font-medium text-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring/50"
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

export function DashboardView() {
  const projects = getProjects();

  const [typeFilter, setTypeFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");

  const availableYears = useMemo(() => {
    const years = [
      ...new Set(projects.map((p) => new Date(p.updatedAt).getFullYear())),
    ].sort((a, b) => b - a);
    return years;
  }, [projects]);

  const availableMonths = useMemo(() => {
    const months = [
      ...new Set(projects.map((p) => new Date(p.updatedAt).getMonth())),
    ].sort((a, b) => a - b);
    return months;
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (typeFilter !== "all" && p.projectType !== typeFilter) return false;
      const date = new Date(p.updatedAt);
      if (
        monthFilter !== "all" &&
        String(date.getMonth()) !== monthFilter
      )
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
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -left-32 top-40 size-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-20 size-72 rounded-full bg-accent/20 blur-3xl" />

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-4 lg:px-10">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20">
            CR
          </span>
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold tracking-tight">
              Client Rooms
            </p>
            <p className="text-sm text-muted-foreground">
              Owner Dashboard
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-6 py-10 lg:px-10">
        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-3">
          <Card className="border-border/70 bg-card/90 backdrop-blur">
            <CardHeader className="gap-2">
              <CardDescription className="flex items-center gap-2">
                <FolderOpen className="size-4" />
                Active Projects
              </CardDescription>
              <CardTitle className="font-display text-3xl font-semibold">
                {activeProjects.length}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              โปรเจกต์ที่อยู่ใน concept, revision หรือ construction
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/90 backdrop-blur">
            <CardHeader className="gap-2">
              <CardDescription className="flex items-center gap-2">
                <FileText className="size-4" />
                Documents
              </CardDescription>
              <CardTitle className="font-display text-3xl font-semibold">
                {totalDocuments}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              ไฟล์ทั้งหมดรวม Canva, PDF และ revision archives
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/90 backdrop-blur">
            <CardHeader className="gap-2">
              <CardDescription className="flex items-center gap-2">
                <ClipboardList className="size-4" />
                Pending Revisions
              </CardDescription>
              <CardTitle className="font-display text-3xl font-semibold">
                {pendingRevisions}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              งานที่ต้อง revise (Todo + Doing)
            </CardContent>
          </Card>
        </section>

        {/* Filters */}
        <section className="flex flex-wrap items-center gap-3">
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
              className="inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" />
              ล้าง filter
            </button>
          )}
          <span className="text-sm text-muted-foreground">
            {filteredProjects.length} โปรเจกต์
          </span>
        </section>

        {/* Project Grid */}
        <section className="grid gap-4 md:grid-cols-2">
          {filteredProjects.length === 0 && (
            <div className="col-span-full rounded-3xl border border-border/70 bg-card/90 p-10 text-center">
              <p className="text-lg text-muted-foreground">
                ไม่พบโปรเจกต์ที่ตรงกับ filter
              </p>
              <button
                onClick={clearFilters}
                className="mt-3 text-sm font-medium text-primary hover:underline"
              >
                ล้าง filter ทั้งหมด
              </button>
            </div>
          )}
          {filteredProjects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </section>

        {/* Task Board */}
        <section className="space-y-5">
          <div className="space-y-1">
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              Revision Tasks
            </h2>
            <p className="text-sm text-muted-foreground">
              ติดตามสถานะงาน revise ของแต่ละโปรเจกต์
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {(["todo", "doing", "done"] as RevisionStatus[]).map((status) => (
              <div
                key={status}
                className={`rounded-3xl border p-4 ${revisionColumnStyles[status]}`}
              >
                <div className="mb-4 flex items-center gap-2">
                  <span
                    className={`size-2.5 rounded-full ${revisionDotStyles[status]}`}
                  />
                  <h3
                    className={`text-sm font-semibold ${revisionHeaderStyles[status]}`}
                  >
                    {getRevisionStatusLabel(status)}
                  </h3>
                  <Badge
                    variant="secondary"
                    className="ml-auto px-2 py-0.5 text-xs"
                  >
                    {taskGroups[status].length}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {taskGroups[status].length === 0 && (
                    <p className="py-4 text-center text-xs text-muted-foreground">
                      ไม่มีงาน
                    </p>
                  )}
                  {taskGroups[status].map((project) => (
                    <Link
                      key={project.slug}
                      href={`/p/${project.slug}`}
                      className="block rounded-2xl border border-border/50 bg-background/80 p-3 transition-all hover:border-border hover:shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="px-2 py-0.5 text-xs">
                          {project.code}
                        </Badge>
                        <Badge
                          className={`px-2 py-0.5 text-xs ${typeColorMap[project.projectType]}`}
                        >
                          {project.projectType}
                        </Badge>
                      </div>
                      <p className="mt-2 font-display text-sm font-semibold leading-tight">
                        {project.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {project.clientName}
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        {project.nextMilestone}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function ProjectCard({ project }: { project: ClientProject }) {
  return (
    <Card className="group border-border/70 bg-card/90 backdrop-blur transition-shadow hover:shadow-lg">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="px-3 py-1">
            {project.code}
          </Badge>
          <ProjectStageBadge stage={project.stage} />
          <Badge className={`px-3 py-1 ${typeColorMap[project.projectType]}`}>
            {project.projectType}
          </Badge>
        </div>
        <CardTitle className="font-display text-2xl">{project.title}</CardTitle>
        <CardDescription>
          {project.clientName} · {project.location} · อัปเดต{" "}
          {formatPortalDate(project.updatedAt)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="line-clamp-2 text-sm leading-7 text-muted-foreground">
          {project.overview}
        </p>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">
            {getProjectDocumentCount(project)} files · {project.viewerCount}{" "}
            viewers
          </span>
          <Link
            href={`/p/${project.slug}`}
            className={`${secondaryLinkClass} whitespace-nowrap`}
          >
            เปิดหน้าลูกค้า
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
