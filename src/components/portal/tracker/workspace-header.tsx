"use client";

import { ChevronDown, Plus, Trash2 } from "lucide-react";

import { phaseAccents, phaseLabels, projectStatuses } from "@/lib/tracker/constants";
import type { TrackerPhase, TrackerProjectDetail, TrackerProjectStatus } from "@/lib/tracker/types";

export function WorkspaceHeader({
  isWorking,
  project,
  onPhaseChange,
  onStatusChange,
  onDeleteProject,
  onNewTask,
}: {
  isWorking: boolean;
  project: TrackerProjectDetail;
  onPhaseChange: (phase: TrackerPhase) => void;
  onStatusChange: (status: TrackerProjectStatus) => void;
  onDeleteProject: () => void;
  onNewTask: () => void;
}) {
  const doneCount = project.tasks.filter((task) => task.status === "done").length;
  const progress = project.tasks.length
    ? Math.round((doneCount / project.tasks.length) * 100)
    : 0;

  return (
    <section className="rounded-[1.5rem] border border-border bg-[radial-gradient(circle_at_top_left,#f6f1e8_0%,#ffffff_45%)] p-4 sm:rounded-[2rem] sm:p-5 md:p-6">
      <div className="flex flex-col gap-4 sm:gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="caption-editorial">Workspace</p>
          <h2 className="mt-2 font-display text-2xl font-medium leading-tight tracking-tight text-balance sm:text-3xl md:text-4xl lg:text-5xl">
            {project.name}
          </h2>
          <p className="mt-3 max-w-3xl text-[13px] leading-6 text-muted-foreground sm:text-sm sm:leading-7">
            {project.overview || "Project board for active tasks, owner decisions, and phase readiness."}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2 sm:gap-3">
            <span
              className="inline-flex rounded-full px-3 py-1.5 text-[13px] font-medium text-white sm:px-4 sm:py-2 sm:text-sm"
              style={{ backgroundColor: phaseAccents[project.phase] }}
            >
              {phaseLabels[project.phase]}
            </span>
            <span className="rounded-full border border-border px-3 py-1.5 text-[13px] text-muted-foreground sm:px-4 sm:py-2 sm:text-sm">
              {project.clientName || "BNJ Studio"} · {project.location || "Bangkok"}
            </span>
            <span className="rounded-full border border-border px-3 py-1.5 text-[13px] text-muted-foreground sm:px-4 sm:py-2 sm:text-sm">
              {project.tasks.length} tasks · {doneCount} done · {progress}% complete
            </span>
          </div>
        </div>

        <div className="flex max-w-xl flex-col gap-3">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3 sm:items-center">
            <SelectPill
              value={project.phase}
              onChange={(value) => onPhaseChange(value as TrackerPhase)}
              options={Object.entries(phaseLabels)}
            />
            <SelectPill
              value={project.status}
              onChange={(value) => onStatusChange(value as TrackerProjectStatus)}
              options={projectStatuses.map((status) => [status, status.replace("_", " ")] as const)}
            />
            <button
              type="button"
              onClick={onNewTask}
              disabled={isWorking}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-[13px] font-medium text-background transition-colors hover:bg-foreground/90 sm:text-sm"
            >
              <Plus className="size-4" />
              Add Task
            </button>
            <button
              type="button"
              onClick={onDeleteProject}
              disabled={isWorking}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-5 text-[13px] font-medium text-rose-600 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
            >
              <Trash2 className="size-4" />
              Delete Project
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/80 ring-1 ring-foreground/5">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${progress}%`,
            backgroundColor: phaseAccents[project.phase],
          }}
        />
      </div>
    </section>
  );
}

function SelectPill({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly (readonly [string, string])[] | [string, string][];
}) {
  return (
    <div className="relative w-full md:w-auto">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full appearance-none rounded-full border border-border bg-background pl-4 pr-10 text-[13px] font-medium capitalize outline-none transition-colors hover:border-foreground focus:border-foreground sm:text-sm"
      >
        {options.map(([optionValue, label]) => (
          <option key={optionValue} value={optionValue}>
            {label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
