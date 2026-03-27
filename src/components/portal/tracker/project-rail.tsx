"use client";

import Link from "next/link";
import { Bot, FolderPlus, ListTodo } from "lucide-react";

import { phaseAccents, phaseLabels } from "@/lib/tracker/constants";
import type { TrackerProjectDetail } from "@/lib/tracker/types";

export function ProjectRail({
  projects,
  activeProjectId,
  pendingReviewCount,
  onSelect,
  onCreateProject,
}: {
  projects: TrackerProjectDetail[];
  activeProjectId: string | null;
  pendingReviewCount: number;
  onSelect: (projectId: string) => void;
  onCreateProject: () => void;
}) {
  return (
    <aside className="flex h-full w-full max-w-none flex-col border-b border-border bg-[linear-gradient(180deg,#ffffff_0%,#faf7f2_100%)] lg:max-w-[290px] lg:border-b-0 lg:border-r">
      <div className="border-b border-border px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-bnj.svg"
            alt="BNJ Studio"
            width={56}
            height={56}
            className="h-9 w-auto shrink-0 sm:h-10"
          />
          <div className="min-w-0">
            <p className="caption-editorial text-[0.65rem] sm:text-[0.7rem]">Tracker</p>
            <h1 className="mt-1 font-display text-xl font-medium leading-tight tracking-tight text-balance sm:text-2xl">
              AI Project Tracker
            </h1>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-5 sm:gap-3">
          <Link
            href="/dashboard"
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border px-4 py-2 text-[13px] leading-5 text-muted-foreground transition-colors hover:border-foreground hover:text-foreground sm:text-sm"
          >
            <ListTodo className="size-4" />
            Dashboard
          </Link>
          <div className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-[13px] leading-5 sm:text-sm">
            <Bot className="size-4" />
            {pendingReviewCount} pending review
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-4 sm:py-5">
        <div className="mb-3 px-2">
          <p className="caption-editorial text-[0.65rem] sm:text-[0.7rem]">Projects</p>
        </div>
        <div className="space-y-2">
          {projects.map((project) => {
            const isActive = project.id === activeProjectId;
            const doneCount = project.tasks.filter((task) => task.status === "done").length;
            const progress = project.tasks.length
              ? Math.round((doneCount / project.tasks.length) * 100)
              : 0;

            return (
              <button
                key={project.id}
                type="button"
                onClick={() => onSelect(project.id)}
                className={`w-full rounded-[1.5rem] border px-4 py-4 text-left transition-all ${
                  isActive
                    ? "border-foreground bg-background shadow-[0_10px_30px_rgba(0,0,0,0.05)]"
                    : "border-border bg-background/70 hover:border-foreground/30 hover:bg-background"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="caption-editorial text-[0.62rem] sm:text-[0.68rem]">
                      {project.code}
                    </p>
                    <p className="mt-1 text-sm font-medium leading-6 text-foreground text-pretty sm:text-base">
                      {project.name}
                    </p>
                    <p className="mt-1 text-[13px] leading-5 text-muted-foreground sm:text-sm">
                      {project.clientName || "BNJ Studio"} · {phaseLabels[project.phase]}
                    </p>
                  </div>
                  <div
                    className="flex size-10 shrink-0 items-center justify-center rounded-full text-[11px] font-medium text-white sm:size-11 sm:text-xs"
                    style={{
                      background: `conic-gradient(${phaseAccents[project.phase]} ${progress * 3.6}deg, #ece7df 0deg)`,
                    }}
                  >
                    <span className="flex size-7 items-center justify-center rounded-full bg-white text-foreground sm:size-8">
                      {progress}%
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-border p-4">
        <button
          type="button"
          onClick={onCreateProject}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-border px-4 py-3 text-[13px] font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground sm:text-sm"
        >
          <FolderPlus className="size-4" />
          Create Project
        </button>
      </div>
    </aside>
  );
}
