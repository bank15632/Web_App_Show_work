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
    <aside className="flex h-full w-full max-w-[290px] flex-col border-r border-border bg-[linear-gradient(180deg,#ffffff_0%,#faf7f2_100%)]">
      <div className="border-b border-border px-6 py-6">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-bnj.svg"
            alt="BNJ Studio"
            width={56}
            height={56}
            className="h-10 w-auto"
          />
          <div>
            <p className="caption-editorial text-[0.7rem]">Tracker</p>
            <h1 className="font-display text-2xl font-medium tracking-tight">
              AI Project Tracker
            </h1>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            <ListTodo className="size-4" />
            Dashboard
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm">
            <Bot className="size-4" />
            {pendingReviewCount} pending review
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="mb-3 px-2">
          <p className="caption-editorial text-[0.7rem]">Projects</p>
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
                  <div>
                    <p className="caption-editorial text-[0.68rem]">{project.code}</p>
                    <p className="mt-1 font-medium text-foreground">{project.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {project.clientName || "BNJ Studio"} · {phaseLabels[project.phase]}
                    </p>
                  </div>
                  <div
                    className="flex size-11 items-center justify-center rounded-full text-xs font-medium text-white"
                    style={{
                      background: `conic-gradient(${phaseAccents[project.phase]} ${progress * 3.6}deg, #ece7df 0deg)`,
                    }}
                  >
                    <span className="flex size-8 items-center justify-center rounded-full bg-white text-foreground">
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
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-border px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
        >
          <FolderPlus className="size-4" />
          Create Project
        </button>
      </div>
    </aside>
  );
}
