"use client";

import { useEffect, useMemo, useState } from "react";
import type { ButtonHTMLAttributes, FormEvent } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CalendarDays,
  GripVertical,
  List,
  Plus,
  RotateCcw,
  SquareKanban,
  Trash2,
} from "lucide-react";

import {
  priorityLabels,
  priorityTone,
  phaseLabels,
  taskStatusLabels,
  taskStatusTone,
  taskTypeLabels,
  trackerTaskStatuses,
} from "@/lib/tracker/constants";
import {
  trackerPhaseChecklistTemplates,
  type TrackerChecklistTemplateSection,
} from "@/lib/tracker/checklists";
import type {
  TrackerChecklistItemRecord,
  TrackerHiddenChecklistItemRecord,
  TrackerPhase,
  TrackerTaskRecord,
} from "@/lib/tracker/types";
import { cn } from "@/lib/utils";
import { isTaskOverdue } from "@/lib/tracker/views";

type ViewMode = "board" | "list";

type BoardState = Record<(typeof trackerTaskStatuses)[number], TrackerTaskRecord[]>;

type ChecklistItemView = {
  key: string;
  label: string;
  description: string;
  isCustom: boolean;
  record: TrackerChecklistItemRecord;
};

type ChecklistSectionView = Omit<TrackerChecklistTemplateSection, "items"> & {
  completedCount: number;
  items: ChecklistItemView[];
};

function buildBoardState(tasks: TrackerTaskRecord[]): BoardState {
  return trackerTaskStatuses.reduce<BoardState>((acc, status) => {
    acc[status] = tasks
      .filter((task) => task.status === status)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    return acc;
  }, {} as BoardState);
}

function getSubtaskProgress(task: TrackerTaskRecord) {
  const total = task.subtasks.length;
  const completed = task.subtasks.filter((subtask) => subtask.completed).length;

  return {
    total,
    completed,
  };
}

function formatDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

function getColumnId(status: TrackerTaskRecord["status"]) {
  return `column:${status}`;
}

function findTaskStatus(board: BoardState, taskId: string) {
  return trackerTaskStatuses.find((status) =>
    board[status].some((task) => task.id === taskId),
  );
}

function buildChecklistSections(
  phase: TrackerPhase,
  checklistItems: TrackerChecklistItemRecord[],
): ChecklistSectionView[] {
  const templateSections = trackerPhaseChecklistTemplates[phase] ?? [];
  const customItemsBySection = new Map<string, TrackerChecklistItemRecord[]>();
  const templateItemByKey = new Map<string, TrackerChecklistItemRecord>();

  for (const item of checklistItems) {
    if (item.isCustom) {
      const items = customItemsBySection.get(item.sectionKey) ?? [];
      items.push(item);
      customItemsBySection.set(item.sectionKey, items);
      continue;
    }

    templateItemByKey.set(item.itemKey, item);
  }

  return templateSections.map((section) => {
    const templateItems = section.items.flatMap((item) => {
      const record = templateItemByKey.get(item.key);
      if (!record) {
        return [];
      }

      return [
        {
          key: item.key,
          label: record.label ?? item.label,
          description: record.description ?? item.description,
          isCustom: false,
          record,
        },
      ];
    });
    const customItems = [...(customItemsBySection.get(section.key) ?? [])]
      .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt))
      .map((item) => ({
        key: item.id,
        label: item.label ?? "Custom item",
        description: item.description ?? "",
        isCustom: true,
        record: item,
      }));
    const items = [...templateItems, ...customItems];

    return {
      ...section,
      items,
      completedCount: items.filter((item) => item.record.completed).length,
    };
  });
}

interface TaskBoardProps {
  phase: TrackerPhase;
  tasks: TrackerTaskRecord[];
  checklistItems: TrackerChecklistItemRecord[];
  hiddenChecklistItems: TrackerHiddenChecklistItemRecord[];
  checklistBusy: boolean;
  onEditTask: (task: TrackerTaskRecord) => void;
  onCreateTask: () => void;
  onToggleChecklist: (itemId: string, completed: boolean) => void;
  onAddChecklistItem: (
    sectionKey: string,
    label: string,
    description: string,
  ) => Promise<void>;
  onRemoveChecklistItem: (itemId: string) => Promise<void>;
  onRestoreHiddenChecklistItem: (itemKey: string) => Promise<void>;
  onReorder: (
    items: Array<{
      taskId: string;
      status: TrackerTaskRecord["status"];
      sortOrder: number;
    }>,
  ) => Promise<void>;
}

export function TaskBoard({
  phase,
  tasks,
  checklistItems,
  hiddenChecklistItems,
  checklistBusy,
  onEditTask,
  onCreateTask,
  onToggleChecklist,
  onAddChecklistItem,
  onRemoveChecklistItem,
  onRestoreHiddenChecklistItem,
  onReorder,
}: TaskBoardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
      ? "list"
      : "board",
  );
  const [board, setBoard] = useState<BoardState>(() => buildBoardState(tasks));
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [showHiddenItems, setShowHiddenItems] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor));
  const checklistSections = useMemo(
    () => buildChecklistSections(phase, checklistItems),
    [phase, checklistItems],
  );
  const checklistStats = useMemo(() => {
    let totalItems = 0;
    let completedItems = 0;

    for (const section of checklistSections) {
      totalItems += section.items.length;
      completedItems += section.completedCount;
    }

    return {
      totalItems,
      completedItems,
      completionRate:
        totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100),
    };
  }, [checklistSections]);

  useEffect(() => {
    setBoard(buildBoardState(tasks));
  }, [tasks]);

  const activeTask = useMemo(
    () => tasks.find((task) => task.id === activeTaskId) ?? null,
    [activeTaskId, tasks],
  );

  async function commitBoard(nextBoard: BoardState) {
    setBoard(nextBoard);
    const payload = trackerTaskStatuses.flatMap((status) =>
      nextBoard[status].map((task, index) => ({
        taskId: task.id,
        status,
        sortOrder: index,
      })),
    );
    await onReorder(payload);
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveTaskId(String(event.active.id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveTaskId(null);
    const overId = event.over?.id ? String(event.over.id) : null;
    if (!overId) return;

    const activeId = String(event.active.id);
    const activeStatus = findTaskStatus(board, activeId);
    if (!activeStatus) return;

    const overStatus = overId.startsWith("column:")
      ? (overId.replace("column:", "") as TrackerTaskRecord["status"])
      : findTaskStatus(board, overId);
    if (!overStatus) return;

    if (activeStatus === overStatus) {
      const currentTasks = [...board[activeStatus]];
      const activeIndex = currentTasks.findIndex((task) => task.id === activeId);
      if (activeIndex === -1) return;

      const overIndex = overId.startsWith("column:")
        ? currentTasks.length - 1
        : currentTasks.findIndex((task) => task.id === overId);
      if (overIndex === -1) return;

      const nextBoard = {
        ...board,
        [activeStatus]: arrayMove(currentTasks, activeIndex, overIndex),
      };
      await commitBoard(nextBoard);
      return;
    }

    const nextBoard = {
      ...board,
      [activeStatus]: [...board[activeStatus]],
      [overStatus]: [...board[overStatus]],
    };

    const activeIndex = nextBoard[activeStatus].findIndex((task) => task.id === activeId);
    if (activeIndex === -1) return;

    const [movedTask] = nextBoard[activeStatus].splice(activeIndex, 1);
    const nextTask = { ...movedTask, status: overStatus };

    if (overId.startsWith("column:")) {
      nextBoard[overStatus].push(nextTask);
    } else {
      const overIndex = nextBoard[overStatus].findIndex((task) => task.id === overId);
      const insertAt = overIndex === -1 ? nextBoard[overStatus].length : overIndex;
      nextBoard[overStatus].splice(insertAt, 0, nextTask);
    }

    await commitBoard(nextBoard);
  }

  return (
    <section className="space-y-4">
      {checklistSections.length > 0 ? (
        <section className="rounded-[1.9rem] border border-border bg-stone-50/70 p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="caption-editorial text-[0.68rem]">Phase Checklist</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h3 className="font-display text-[1.35rem] font-medium tracking-tight sm:text-[1.55rem]">
                  {phaseLabels[phase]} readiness
                </h3>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700 sm:text-xs">
                  {checklistStats.completedItems}/{checklistStats.totalItems} complete
                </span>
              </div>
              <p className="mt-2 text-[12px] leading-5 text-muted-foreground sm:text-[13px] sm:leading-6">
                เช็ก deliverables สำคัญของแต่ละ phase ให้ครบก่อนปล่อย drawing set
                หรือส่งต่องานในทีม โดยเฉพาะหมวด construction documents ที่ต้องเห็นว่า
                floor plan, electrical, ceiling, elevations, sections และ isometric พร้อมแล้วหรือยัง
              </p>
            </div>
            <div className="min-w-full rounded-[1.35rem] border border-border bg-background px-4 py-3 sm:min-w-[15rem]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Completion
                </span>
                <span className="text-[13px] font-medium text-foreground sm:text-sm">
                  {checklistStats.completionRate}%
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-foreground transition-all"
                  style={{ width: `${checklistStats.completionRate}%` }}
                />
              </div>
              <p className="mt-2 text-[12px] leading-5 text-muted-foreground">
                ใช้เป็นเช็กลิสต์ก่อน review ภายใน หรือก่อนออกชุดแบบ revision ถัดไป
              </p>
            </div>
          </div>

          {hiddenChecklistItems.length > 0 ? (
            <div className="mt-4 rounded-[1.35rem] border border-border bg-background p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[13px] font-medium text-foreground sm:text-sm">
                    Hidden default items
                  </p>
                  <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
                    รายการมาตรฐานที่ถูกซ่อนจาก checklist ของโปรเจ็กต์นี้ สามารถกด restore กลับมาได้ทุกเมื่อ
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHiddenItems((value) => !value)}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-[12px] font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground sm:text-[13px]"
                >
                  <RotateCcw className="size-3.5" />
                  {showHiddenItems
                    ? "Hide restore list"
                    : `Restore hidden items (${hiddenChecklistItems.length})`}
                </button>
              </div>

              {showHiddenItems ? (
                <div className="mt-4 grid gap-2 lg:grid-cols-2">
                  {hiddenChecklistItems.map((item) => (
                    <button
                      key={`${item.phase}:${item.itemKey}`}
                      type="button"
                      disabled={checklistBusy}
                      onClick={() => {
                        void onRestoreHiddenChecklistItem(item.itemKey);
                      }}
                      className="flex items-start justify-between gap-3 rounded-[1rem] border border-border px-3 py-3 text-left transition-colors hover:border-foreground/30 disabled:opacity-60"
                    >
                      <span className="min-w-0">
                        <span className="block text-[13px] font-medium text-foreground sm:text-sm">
                          {item.label}
                        </span>
                        <span className="mt-1 block text-[12px] leading-5 text-muted-foreground">
                          {item.sectionTitle}
                          {item.description ? ` • ${item.description}` : ""}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-full border border-border px-3 py-1 text-[11px] font-medium text-muted-foreground sm:text-xs">
                        Restore
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-5 grid gap-3 xl:grid-cols-3">
            {checklistSections.map((section) => (
              <ChecklistSectionCard
                key={section.key}
                section={section}
                busy={checklistBusy}
                onToggleChecklist={onToggleChecklist}
                onAddChecklistItem={onAddChecklistItem}
                onRemoveChecklistItem={onRemoveChecklistItem}
              />
            ))}
          </div>
        </section>
      ) : null}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="caption-editorial text-[0.7rem]">Execution</p>
          <h3 className="mt-1 font-display text-2xl font-medium tracking-tight sm:text-3xl">
            Task flow
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onCreateTask}
            className="rounded-full border border-border px-4 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground sm:text-sm"
          >
            Quick add
          </button>
          <div className="inline-flex items-center gap-1 rounded-full border border-border bg-background p-1">
            <button
              type="button"
              onClick={() => setViewMode("board")}
              className={`inline-flex size-9 items-center justify-center rounded-full ${
                viewMode === "board" ? "bg-foreground text-background" : "text-muted-foreground"
              }`}
            >
              <SquareKanban className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`inline-flex size-9 items-center justify-center rounded-full ${
                viewMode === "list" ? "bg-foreground text-background" : "text-muted-foreground"
              }`}
            >
              <List className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} onEdit={() => onEditTask(task)} />
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={(event) => {
            void handleDragEnd(event);
          }}
        >
          <div className="-mx-1 overflow-x-auto pb-2">
            <div className="grid min-w-[60rem] grid-cols-[repeat(5,minmax(11.5rem,1fr))] gap-3 px-1 md:min-w-[76rem] md:grid-cols-[repeat(5,minmax(14.5rem,1fr))] md:gap-4 lg:min-w-[89rem] lg:grid-cols-[repeat(5,minmax(17rem,1fr))]">
              {trackerTaskStatuses.map((status) => (
                <TaskColumn
                  key={status}
                  status={status}
                  tasks={board[status]}
                  onEditTask={onEditTask}
                />
              ))}
            </div>
          </div>
          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} dragging onEdit={() => undefined} /> : null}
          </DragOverlay>
        </DndContext>
      )}
    </section>
  );
}

function ChecklistSectionCard({
  section,
  busy,
  onToggleChecklist,
  onAddChecklistItem,
  onRemoveChecklistItem,
}: {
  section: ChecklistSectionView;
  busy: boolean;
  onToggleChecklist: (itemId: string, completed: boolean) => void;
  onAddChecklistItem: (
    sectionKey: string,
    label: string,
    description: string,
  ) => Promise<void>;
  onRemoveChecklistItem: (itemId: string) => Promise<void>;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [draftLabel, setDraftLabel] = useState("");
  const [draftDescription, setDraftDescription] = useState("");

  async function handleCreateItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const label = draftLabel.trim();
    if (!label) return;

    await onAddChecklistItem(section.key, label, draftDescription.trim());
    setDraftLabel("");
    setDraftDescription("");
    setIsAdding(false);
  }

  return (
    <article className="rounded-[1.45rem] border border-border bg-background p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-[15px] font-semibold leading-6 text-foreground sm:text-base">
            {section.title}
          </h4>
          <p className="mt-1 text-[12px] leading-5 text-muted-foreground sm:text-[13px] sm:leading-6">
            {section.description}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground sm:text-xs">
            {section.completedCount}/{section.items.length}
          </span>
          <button
            type="button"
            disabled={busy}
            onClick={() => setIsAdding((value) => !value)}
            className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:opacity-60 sm:text-xs"
          >
            <Plus className="size-3.5" />
            Add item
          </button>
        </div>
      </div>

      {isAdding ? (
        <form
          className="mt-4 space-y-2 rounded-[1rem] border border-dashed border-border bg-stone-50/70 p-3"
          onSubmit={(event) => {
            void handleCreateItem(event);
          }}
        >
          <input
            value={draftLabel}
            onChange={(event) => setDraftLabel(event.target.value)}
            placeholder="Checklist item name"
            className="h-10 w-full rounded-full border border-border bg-background px-4 text-[13px] outline-none transition-colors focus:border-foreground"
          />
          <input
            value={draftDescription}
            onChange={(event) => setDraftDescription(event.target.value)}
            placeholder="Short note or acceptance criteria"
            className="h-10 w-full rounded-full border border-border bg-background px-4 text-[13px] outline-none transition-colors focus:border-foreground"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setDraftLabel("");
                setDraftDescription("");
                setIsAdding(false);
              }}
              className="rounded-full border border-border px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground sm:text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || draftLabel.trim().length === 0}
              className="rounded-full bg-foreground px-3 py-1.5 text-[11px] font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-60 sm:text-xs"
            >
              Save item
            </button>
          </div>
        </form>
      ) : null}

      <div className="mt-4 space-y-2.5">
        {section.items.length === 0 ? (
          <div className="rounded-[1rem] border border-dashed border-border px-3 py-4 text-[12px] leading-5 text-muted-foreground">
            No checklist items in this section right now. Add project-specific items here when this package needs extra deliverables.
          </div>
        ) : null}
        {section.items.map((item) => (
          <ChecklistItemButton
            key={item.key}
            item={item}
            busy={busy}
            onToggleChecklist={onToggleChecklist}
            onRemoveChecklistItem={onRemoveChecklistItem}
          />
        ))}
      </div>
    </article>
  );
}

function ChecklistItemButton({
  item,
  busy,
  onToggleChecklist,
  onRemoveChecklistItem,
}: {
  item: ChecklistItemView;
  busy: boolean;
  onToggleChecklist: (itemId: string, completed: boolean) => void;
  onRemoveChecklistItem: (itemId: string) => Promise<void>;
}) {
  const checked = item.record.completed;
  const disabled = busy;

  return (
    <div
      className={`flex w-full items-start gap-3 rounded-[1rem] border px-3 py-3 text-left transition-colors ${
        checked
          ? "border-emerald-200 bg-emerald-50/70"
          : "border-border bg-background hover:border-foreground/30"
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      <button
        type="button"
        disabled={disabled}
        aria-pressed={checked}
        onClick={() => {
          onToggleChecklist(item.record.id, !checked);
        }}
        className="flex min-w-0 flex-1 items-start gap-3 text-left disabled:cursor-not-allowed"
      >
        <span
          className={`mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border ${
            checked
              ? "border-emerald-500 text-emerald-600"
              : "border-border text-transparent"
          }`}
        >
          <span
            className={`size-2 rounded-full ${
              checked ? "bg-current" : "bg-transparent"
            }`}
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="block text-[13px] font-medium leading-5 text-foreground sm:text-sm">
              {item.label}
            </span>
            {item.isCustom ? (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-amber-700">
                Custom
              </span>
            ) : null}
          </span>
          {item.description ? (
            <span className="mt-1 block text-[12px] leading-5 text-muted-foreground">
              {item.description}
            </span>
          ) : null}
        </span>
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          const confirmed = window.confirm(
            `Remove "${item.label}" from this project's checklist?`,
          );
          if (!confirmed) {
            return;
          }

          void onRemoveChecklistItem(item.record.id);
        }}
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-rose-300 hover:text-rose-600 disabled:opacity-60"
        aria-label={`Remove ${item.label}`}
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

function TaskSubtaskPreview({
  task,
  compact = false,
}: {
  task: TrackerTaskRecord;
  compact?: boolean;
}) {
  const progress = getSubtaskProgress(task);

  if (progress.total === 0) {
    return null;
  }

  const visibleSubtasks = task.subtasks.slice(0, compact ? 2 : 4);

  return (
    <div className="mt-4 rounded-[1rem] border border-border bg-background/80 px-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Sub-Tasks
        </span>
        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {progress.completed}/{progress.total} complete
        </span>
      </div>
      <div className="mt-2 space-y-1.5">
        {visibleSubtasks.map((subtask) => (
          <div key={subtask.id} className="flex items-start gap-2 text-[12px] leading-5 text-muted-foreground">
            <span
              className={cn(
                "mt-1 inline-flex size-3 shrink-0 rounded-full border",
                subtask.completed ? "border-emerald-500 bg-emerald-500" : "border-border bg-transparent",
              )}
            />
            <span className={subtask.completed ? "line-through opacity-70" : ""}>
              {subtask.title}
            </span>
          </div>
        ))}
      </div>
      {task.subtasks.length > visibleSubtasks.length ? (
        <p className="mt-2 text-[11px] text-muted-foreground">
          +{task.subtasks.length - visibleSubtasks.length} more sub-task
          {task.subtasks.length - visibleSubtasks.length === 1 ? "" : "s"}
        </p>
      ) : null}
    </div>
  );
}

function TaskColumn({
  status,
  tasks,
  onEditTask,
}: {
  status: TrackerTaskRecord["status"];
  tasks: TrackerTaskRecord[];
  onEditTask: (task: TrackerTaskRecord) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: getColumnId(status),
  });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-[1.75rem] border bg-background p-4 transition-colors ${
        isOver ? "border-foreground" : "border-border"
      } min-w-0`}
    >
      <div className="mb-4 flex items-center gap-2">
        <span
          className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-medium sm:text-xs ${taskStatusTone[status]}`}
        >
          {taskStatusLabels[status]}
        </span>
        <span className="text-[13px] text-muted-foreground sm:text-sm">{tasks.length}</span>
      </div>
      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <div className="rounded-[1.25rem] border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              Drop tasks here
            </div>
          ) : null}
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onEdit={() => onEditTask(task)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableTaskCard({
  task,
  onEdit,
}: {
  task: TrackerTaskRecord;
  onEdit: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: task.id,
    });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <TaskCard
        task={task}
        dragging={isDragging}
        onEdit={onEdit}
        handleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

function TaskCard({
  task,
  dragging = false,
  onEdit,
  handleProps,
}: {
  task: TrackerTaskRecord;
  dragging?: boolean;
  onEdit: () => void;
  handleProps?: ButtonHTMLAttributes<HTMLButtonElement>;
}) {
  const dragHandleProps = handleProps ?? {};
  const progress = getSubtaskProgress(task);

  return (
    <article
      className={`rounded-[1.4rem] border bg-stone-50/50 p-4 transition-all sm:p-5 ${
        dragging ? "border-foreground shadow-[0_16px_40px_rgba(0,0,0,0.12)]" : "border-border hover:border-foreground/30"
      }`}
    >
      <div className="flex items-start gap-4">
        <button
          type="button"
          className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground sm:size-9"
          {...dragHandleProps}
        >
          <GripVertical className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <button type="button" onClick={onEdit} className="w-full text-left">
            <h4 className="text-pretty text-sm font-semibold leading-6 text-foreground sm:text-base sm:leading-7">
              {task.title}
            </h4>
          </button>
          {task.description ? (
            <p className="mt-2 text-pretty text-[13px] leading-6 text-muted-foreground sm:text-sm sm:leading-7">
              {task.description}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium sm:text-xs ${priorityTone[task.priority]}`}
            >
              {priorityLabels[task.priority]}
            </span>
            <span className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground sm:text-xs">
              {taskTypeLabels[task.taskType]}
            </span>
            {progress.total > 0 ? (
              <span className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground sm:text-xs">
                {progress.completed}/{progress.total} sub-tasks
              </span>
            ) : null}
            {task.dueDate ? (
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] sm:text-xs ${
                  isTaskOverdue(task)
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-border text-muted-foreground"
                }`}
              >
                <CalendarDays className="size-3" />
                {formatDate(task.dueDate)}
              </span>
            ) : null}
          </div>
          <TaskSubtaskPreview task={task} />
        </div>
      </div>
    </article>
  );
}

function TaskRow({
  task,
  onEdit,
}: {
  task: TrackerTaskRecord;
  onEdit: () => void;
}) {
  const progress = getSubtaskProgress(task);

  return (
    <button
      type="button"
      onClick={onEdit}
      className="flex w-full flex-col gap-3 rounded-[1.5rem] border border-border bg-background px-5 py-4 text-left transition-all hover:border-foreground/30"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium sm:text-sm">{task.title}</p>
          {task.description ? (
            <p className="mt-1 text-[13px] text-muted-foreground sm:text-sm">{task.description}</p>
          ) : null}
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-[11px] font-medium sm:text-xs ${taskStatusTone[task.status]}`}
        >
          {taskStatusLabels[task.status]}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full border px-2.5 py-1 text-[0.7rem] font-medium ${priorityTone[task.priority]}`}
        >
          {priorityLabels[task.priority]}
        </span>
        <span className="rounded-full border border-border px-2.5 py-1 text-[0.7rem] text-muted-foreground">
          {taskTypeLabels[task.taskType]}
        </span>
        {progress.total > 0 ? (
          <span className="rounded-full border border-border px-2.5 py-1 text-[0.7rem] text-muted-foreground">
            {progress.completed}/{progress.total} sub-tasks
          </span>
        ) : null}
        {task.dueDate ? (
          <span className="text-xs text-muted-foreground">{formatDate(task.dueDate)}</span>
        ) : null}
      </div>
      <TaskSubtaskPreview task={task} compact />
    </button>
  );
}
