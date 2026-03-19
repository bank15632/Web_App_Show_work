"use client";

import { ChevronDown, Plus, Upload } from "lucide-react";

import { phaseAccents, phaseLabels, projectStatuses } from "@/lib/tracker/constants";
import type { TrackerPhase, TrackerProjectDetail, TrackerProjectStatus } from "@/lib/tracker/types";

export function WorkspaceHeader({
  project,
  onPhaseChange,
  onStatusChange,
  onNewTask,
  onOpenIntake,
}: {
  project: TrackerProjectDetail;
  onPhaseChange: (phase: TrackerPhase) => void;
  onStatusChange: (status: TrackerProjectStatus) => void;
  onNewTask: () => void;
  onOpenIntake: () => void;
}) {
  const doneCount = project.tasks.filter((task) => task.status === "done").length;
  const progress = project.tasks.length
    ? Math.round((doneCount / project.tasks.length) * 100)
    : 0;

  return (
    <section className="rounded-[2rem] border border-border bg-[radial-gradient(circle_at_top_left,#f6f1e8_0%,#ffffff_45%)] p-6">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="caption-editorial">Workspace</p>
          <h2 className="mt-2 font-display text-4xl font-medium tracking-tight sm:text-5xl">
            {project.name}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
            {project.overview || "AI review queue for architecture tasks, artifacts, and decisions."}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span
              className="inline-flex rounded-full px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: phaseAccents[project.phase] }}
            >
              {phaseLabels[project.phase]}
            </span>
            <span className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground">
              {project.clientName || "BNJ Studio"} · {project.location || "Bangkok"}
            </span>
            <span className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground">
              {project.tasks.length} tasks · {doneCount} done · {progress}% complete
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
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
            onClick={onOpenIntake}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-background px-5 text-sm font-medium transition-colors hover:border-foreground"
          >
            <Upload className="size-4" />
            Intake
          </button>
          <button
            type="button"
            onClick={onNewTask}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            <Plus className="size-4" />
            Add Task
          </button>
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
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 appearance-none rounded-full border border-border bg-background pl-4 pr-10 text-sm font-medium capitalize outline-none transition-colors hover:border-foreground focus:border-foreground"
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
