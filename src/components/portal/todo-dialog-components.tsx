"use client";

import { useRef, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  priorityDescriptions,
  priorityLabels,
  taskStatusDescriptions,
  taskStatusLabels,
  taskTypeDescriptions,
  taskTypeLabels,
} from "@/lib/tracker/constants";
import type {
  TrackerDecisionMutationInput,
  TrackerProjectMutationInput,
  TrackerTaskMutationInput,
} from "@/lib/tracker/types";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { cn } from "@/lib/utils";

type DecisionDraft = TrackerDecisionMutationInput;
type ProjectDraft = TrackerProjectMutationInput;

function getEditableSubtasks(subtasks: NonNullable<TrackerTaskMutationInput["subtasks"]>) {
  if (subtasks.length === 0) return [{ title: "", completed: false }];
  return subtasks;
}

export function DialogHelperCard({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-border bg-secondary/30 px-4 py-4 text-sm leading-7 text-muted-foreground">
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1">{body}</p>
    </div>
  );
}

export function SidebarToggleButton({
  collapsed,
  side,
  hideLabel,
  showLabel,
  onClick,
}: {
  collapsed: boolean;
  side: "left" | "right";
  hideLabel: string;
  showLabel: string;
  onClick: () => void;
}) {
  const isLeftSide = side === "left";
  const Icon = collapsed
    ? isLeftSide
      ? ChevronRight
      : ChevronLeft
    : isLeftSide
      ? ChevronLeft
      : ChevronRight;
  const label = collapsed ? showLabel : hideLabel;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={collapsed}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-full border bg-background px-4 text-[13px] font-medium transition-colors sm:text-sm",
        collapsed
          ? "border-foreground text-foreground"
          : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
      )}
    >
      {isLeftSide ? <Icon className="size-4" /> : null}
      <span>{label}</span>
      {!isLeftSide ? <Icon className="size-4" /> : null}
    </button>
  );
}

export function DialogFrame({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const trapRef = useFocusTrap<HTMLDivElement>(true);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8"
      onClick={onClose}
      onKeyDown={(event) => { if (event.key === "Escape") onClose(); }}
    >
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-background p-6 shadow-[0_24px_80px_rgba(0,0,0,0.2)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="caption-editorial text-[0.7rem]">Kanban board</p>
            <h3 className="mt-1 font-display text-3xl font-medium tracking-tight">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function WorkspaceMutationOverlay({ open }: { open: boolean }) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/55 px-4 backdrop-blur-[2px]">
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-3 rounded-[1.5rem] border border-border bg-background px-5 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.14)]"
      >
        <span className="size-4 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
        <div>
          <p className="text-sm font-medium text-foreground">Updating Kanban board...</p>
          <p className="text-xs text-muted-foreground">
            Please wait so actions are not submitted twice.
          </p>
        </div>
      </div>
    </div>
  );
}

export function DialogActions({
  onCancel,
  working,
  submitLabel = "Save",
}: {
  onCancel: () => void;
  working: boolean;
  submitLabel?: string;
}) {
  return (
    <div className="flex justify-end gap-3">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={working}
        className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-60"
      >
        {working ? "Working..." : submitLabel}
      </button>
    </div>
  );
}

export function TaskFormFields({
  draft,
  onChange,
}: {
  draft: TrackerTaskMutationInput;
  onChange: (draft: TrackerTaskMutationInput) => void;
}) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const subtaskRows = getEditableSubtasks(draft.subtasks ?? []);
  const subtaskCount = subtaskRows.filter((subtask) => subtask.title.trim().length > 0).length;

  function updateSubtasks(nextSubtasks: NonNullable<TrackerTaskMutationInput["subtasks"]>) {
    onChange({
      ...draft,
      subtasks: nextSubtasks,
    });
  }

  function handleSubtaskChange(
    index: number,
    patch: Partial<NonNullable<TrackerTaskMutationInput["subtasks"]>[number]>,
  ) {
    const nextSubtasks = subtaskRows.map((subtask, subtaskIndex) =>
      subtaskIndex === index ? { ...subtask, ...patch } : subtask,
    );
    updateSubtasks(nextSubtasks);
  }

  function handleAddSubtask(afterIndex?: number) {
    const insertAt = afterIndex === undefined ? subtaskRows.length : afterIndex + 1;
    const nextSubtasks = [...subtaskRows];
    nextSubtasks.splice(insertAt, 0, { title: "", completed: false });
    updateSubtasks(nextSubtasks);
    window.requestAnimationFrame(() => {
      inputRefs.current[insertAt]?.focus();
    });
  }

  function handleRemoveSubtask(index: number) {
    const remainingSubtasks = subtaskRows.filter((_, subtaskIndex) => subtaskIndex !== index);
    updateSubtasks(remainingSubtasks);
  }

  return (
    <>
      <DialogHelperCard
        title="Use this form when the task is already clear."
        body="Create or update a task here when the owner, scope, and next step are known enough to track directly on the Kanban board."
      />
      <input
        value={draft.title}
        onChange={(event) => onChange({ ...draft, title: event.target.value })}
        placeholder="Task title"
        className="h-11 w-full rounded-full border border-border px-4 text-sm outline-none transition-colors focus:border-foreground"
      />
      <textarea
        value={draft.description ?? ""}
        onChange={(event) =>
          onChange({ ...draft, description: event.target.value })
        }
        placeholder="Description"
        rows={5}
        className="w-full rounded-[1.25rem] border border-border px-4 py-3 text-sm outline-none transition-colors focus:border-foreground"
      />
      <label className="grid gap-2 text-sm text-foreground">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Sub-Tasks
          </span>
          <span className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            {subtaskCount} item{subtaskCount === 1 ? "" : "s"}
          </span>
        </div>
        <div className="space-y-2 rounded-[1.25rem] border border-border px-3 py-3">
          {subtaskRows.map((subtask, index) => (
            <div key={`subtask-row-${index}`} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={subtask.completed === true}
                onChange={(event) =>
                  handleSubtaskChange(index, { completed: event.target.checked })
                }
                className="size-4 rounded border-border"
              />
              <input
                ref={(element) => {
                  inputRefs.current[index] = element;
                }}
                value={subtask.title}
                onChange={(event) =>
                  handleSubtaskChange(index, { title: event.target.value })
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleAddSubtask(index);
                    return;
                  }

                  if (
                    event.key === "Backspace" &&
                    subtask.title.length === 0 &&
                    subtaskRows.length > 1
                  ) {
                    event.preventDefault();
                    const focusIndex = Math.max(index - 1, 0);
                    handleRemoveSubtask(index);
                    window.requestAnimationFrame(() => {
                      inputRefs.current[focusIndex]?.focus();
                    });
                  }
                }}
                placeholder={index === 0 ? "Example: Add printer to perspective" : "Next sub-task"}
                className="h-11 flex-1 rounded-full border border-border px-4 text-sm outline-none transition-colors focus:border-foreground"
              />
              <button
                type="button"
                onClick={() => handleRemoveSubtask(index)}
                className="inline-flex h-11 items-center rounded-full border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => handleAddSubtask()}
            className="inline-flex h-10 items-center rounded-full border border-border px-4 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            Add another sub-task
          </button>
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          Press Enter to add the next row right away, and tick the checkbox when that sub-task is
          done.
        </p>
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-foreground">
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Status
          </span>
          <select
            value={draft.status}
            onChange={(event) =>
              onChange({
                ...draft,
                status: event.target.value as TrackerTaskMutationInput["status"],
              })
            }
            className="h-11 rounded-full border border-border px-4 text-sm outline-none transition-colors focus:border-foreground"
          >
            {Object.entries(taskStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <p className="text-xs leading-5 text-muted-foreground">
            {taskStatusDescriptions[draft.status]}
          </p>
        </label>
        <label className="grid gap-2 text-sm text-foreground">
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Task Type
          </span>
          <select
            value={draft.taskType}
            onChange={(event) =>
              onChange({
                ...draft,
                taskType: event.target.value as TrackerTaskMutationInput["taskType"],
              })
            }
            className="h-11 rounded-full border border-border px-4 text-sm outline-none transition-colors focus:border-foreground"
          >
            {Object.entries(taskTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <p className="text-xs leading-5 text-muted-foreground">
            {taskTypeDescriptions[draft.taskType]}
          </p>
        </label>
        <label className="grid gap-2 text-sm text-foreground">
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Priority
          </span>
          <select
            value={draft.priority}
            onChange={(event) =>
              onChange({
                ...draft,
                priority: event.target.value as TrackerTaskMutationInput["priority"],
              })
            }
            className="h-11 rounded-full border border-border px-4 text-sm outline-none transition-colors focus:border-foreground"
          >
            {Object.entries(priorityLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <p className="text-xs leading-5 text-muted-foreground">
            {priorityDescriptions[draft.priority]}
          </p>
        </label>
        <label className="grid gap-2 text-sm text-foreground">
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Due Date
          </span>
          <input
            type="date"
            value={draft.dueDate ?? ""}
            onChange={(event) =>
              onChange({
                ...draft,
                dueDate: event.target.value || null,
              })
            }
            className="h-11 rounded-full border border-border px-4 text-sm outline-none transition-colors focus:border-foreground"
          />
          <p className="text-xs leading-5 text-muted-foreground">
            Use this when there is a real deadline, handoff date, or follow-up date the team should
            see on the board.
          </p>
        </label>
      </div>
    </>
  );
}

export function DecisionFormFields({
  draft,
  onChange,
}: {
  draft: DecisionDraft;
  onChange: (draft: DecisionDraft) => void;
}) {
  return (
    <>
      <DialogHelperCard
        title="Use this for final approved direction."
        body="Record client approvals, design choices, scope calls, or internal decisions that the team should be able to reopen, edit, and trust later."
      />
      <input
        value={draft.title}
        onChange={(event) => onChange({ ...draft, title: event.target.value })}
        placeholder="Decision title"
        className="h-11 w-full rounded-full border border-border px-4 text-sm outline-none transition-colors focus:border-foreground"
      />
      <textarea
        value={draft.decisionText}
        onChange={(event) =>
          onChange({ ...draft, decisionText: event.target.value })
        }
        placeholder="What was decided, what changed, and what the team should follow next?"
        rows={5}
        className="w-full rounded-[1.25rem] border border-border px-4 py-3 text-sm outline-none transition-colors focus:border-foreground"
      />
      <div className="grid gap-4 md:grid-cols-2">
        <input
          value={draft.decidedBy ?? ""}
          onChange={(event) => onChange({ ...draft, decidedBy: event.target.value })}
          placeholder="Decided by"
          className="h-11 rounded-full border border-border px-4 text-sm outline-none transition-colors focus:border-foreground"
        />
        <input
          type="date"
          value={draft.decidedAt ?? ""}
          onChange={(event) => onChange({ ...draft, decidedAt: event.target.value })}
          className="h-11 rounded-full border border-border px-4 text-sm outline-none transition-colors focus:border-foreground"
        />
      </div>
    </>
  );
}

export function ProjectFormFields({
  draft,
  onChange,
}: {
  draft: ProjectDraft;
  onChange: (draft: ProjectDraft) => void;
}) {
  return (
    <>
      <input
        value={draft.name}
        onChange={(event) => onChange({ ...draft, name: event.target.value })}
        placeholder="Project name"
        className="h-11 w-full rounded-full border border-border px-4 text-sm outline-none transition-colors focus:border-foreground"
      />
      <div className="grid gap-4 md:grid-cols-2">
        <input
          value={draft.code ?? ""}
          onChange={(event) => onChange({ ...draft, code: event.target.value })}
          placeholder="Code"
          className="h-11 rounded-full border border-border px-4 text-sm outline-none transition-colors focus:border-foreground"
        />
        <input
          value={draft.clientName ?? ""}
          onChange={(event) =>
            onChange({ ...draft, clientName: event.target.value })
          }
          placeholder="Client"
          className="h-11 rounded-full border border-border px-4 text-sm outline-none transition-colors focus:border-foreground"
        />
        <select
          value={draft.phase}
          onChange={(event) =>
            onChange({
              ...draft,
              phase: event.target.value as ProjectDraft["phase"],
            })
          }
          className="h-11 rounded-full border border-border px-4 text-sm outline-none transition-colors focus:border-foreground"
        >
          <option value="concept">Concept</option>
          <option value="schematic">Schematic</option>
          <option value="design_development">Design Development</option>
          <option value="construction_documents">Construction Documents</option>
          <option value="tender">Tender</option>
          <option value="construction">Construction</option>
          <option value="handover">Handover</option>
        </select>
        <input
          value={draft.location ?? ""}
          onChange={(event) =>
            onChange({ ...draft, location: event.target.value })
          }
          placeholder="Location"
          className="h-11 rounded-full border border-border px-4 text-sm outline-none transition-colors focus:border-foreground"
        />
      </div>
      <textarea
        value={draft.overview ?? ""}
        onChange={(event) => onChange({ ...draft, overview: event.target.value })}
        placeholder="Overview"
        rows={4}
        className="w-full rounded-[1.25rem] border border-border px-4 py-3 text-sm outline-none transition-colors focus:border-foreground"
      />
    </>
  );
}
