"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  ChevronDown,
  ChevronRight,
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
import { isTaskOverdue, isTaskDueToday } from "@/lib/tracker/views";

function getOverdueDays(task: TrackerTaskRecord) {
  if (!task.dueDate || task.status === "done") return 0;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(task.dueDate);
  due.setHours(0, 0, 0, 0);
  const diff = now.getTime() - due.getTime();
  return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
}

function isDueTodayTask(task: TrackerTaskRecord) {
  if (!task.dueDate || task.status === "done") return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(task.dueDate);
  due.setHours(0, 0, 0, 0);
  return now.getTime() === due.getTime();
}

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
  const [showNoDeadlineAlert, setShowNoDeadlineAlert] = useState(false);
  const [showDeadlineAlert, setShowDeadlineAlert] = useState(true);
  const noDeadlineTasks = useMemo(
    () => tasks.filter((t) => !t.dueDate && t.status !== "done"),
    [tasks],
  );
  const overdueTasks = useMemo(
    () => tasks.filter((t) => isTaskOverdue(t)),
    [tasks],
  );
  const dueTodayTasks = useMemo(
    () => tasks.filter((t) => isTaskDueToday(t)),
    [tasks],
  );
  const prevNoDeadlineCount = useRef(noDeadlineTasks.length);

  useEffect(() => {
    if (noDeadlineTasks.length > 0 && noDeadlineTasks.length > prevNoDeadlineCount.current) {
      setShowNoDeadlineAlert(true);
    }
    prevNoDeadlineCount.current = noDeadlineTasks.length;
  }, [noDeadlineTasks.length]);
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

  const [isChecklistOpen, setIsChecklistOpen] = useState(false);

  return (
    <section className="space-y-4">
      {showNoDeadlineAlert && noDeadlineTasks.length > 0 ? (
        <NoDeadlineAlert
          tasks={noDeadlineTasks}
          onClose={() => setShowNoDeadlineAlert(false)}
          onEditTask={onEditTask}
        />
      ) : null}
      {showDeadlineAlert && (overdueTasks.length > 0 || dueTodayTasks.length > 0) ? (
        <DeadlineAlert
          overdueTasks={overdueTasks}
          dueTodayTasks={dueTodayTasks}
          onClose={() => setShowDeadlineAlert(false)}
          onEditTask={onEditTask}
        />
      ) : null}
      {checklistSections.length > 0 ? (
        <section className="rounded-[1.9rem] border border-border bg-stone-50/70">
          <button
            type="button"
            onClick={() => setIsChecklistOpen((prev) => !prev)}
            className="flex w-full items-center justify-between gap-3 p-4 text-left sm:p-5"
          >
            <div className="flex flex-wrap items-center gap-3">
              {isChecklistOpen ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
              <p className="caption-editorial text-[0.68rem]">Phase Checklist</p>
              <span className="font-display text-base font-medium tracking-tight sm:text-lg">
                {phaseLabels[phase]} readiness
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700 sm:text-xs">
                {checklistStats.completionRate}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-[13px] text-muted-foreground sm:inline">
                {checklistStats.completedItems}/{checklistStats.totalItems} complete
              </span>
              <div className="h-2 w-20 overflow-hidden rounded-full bg-secondary sm:w-28">
                <div
                  className="h-full rounded-full bg-foreground transition-all"
                  style={{ width: `${checklistStats.completionRate}%` }}
                />
              </div>
            </div>
          </button>

          {isChecklistOpen ? (
            <div className="border-t border-border p-4 sm:p-5">
              {hiddenChecklistItems.length > 0 ? (
                <div className="mb-4 rounded-[1.35rem] border border-border bg-background p-4">
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

              <div className="grid gap-3 xl:grid-cols-3">
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
            </div>
          ) : null}
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

function NoDeadlineAlert({
  tasks,
  onClose,
  onEditTask,
}: {
  tasks: TrackerTaskRecord[];
  onClose: () => void;
  onEditTask: (task: TrackerTaskRecord) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-[2rem] bg-background p-6 shadow-[0_24px_80px_rgba(0,0,0,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-violet-600">
              No Deadline Warning
            </p>
            <h3 className="mt-1 font-display text-2xl font-medium tracking-tight">
              {tasks.length} task{tasks.length === 1 ? "" : "s"} without deadline
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Task เหล่านี้ยังไม่มีกำหนดส่ง ควรตั้ง deadline เพื่อติดตามได้ชัดเจน
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            Close
          </button>
        </div>
        <div className="mt-4 space-y-2">
          {tasks.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => {
                onEditTask(task);
                onClose();
              }}
              className="flex w-full items-center justify-between gap-3 rounded-[1.25rem] border border-violet-200 bg-violet-50/50 px-4 py-3 text-left transition-colors hover:border-violet-400"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{task.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {priorityLabels[task.priority]} · {taskStatusLabels[task.status]}
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-medium text-violet-600">
                Set deadline
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function DeadlineAlert({
  overdueTasks,
  dueTodayTasks,
  onClose,
  onEditTask,
}: {
  overdueTasks: TrackerTaskRecord[];
  dueTodayTasks: TrackerTaskRecord[];
  onClose: () => void;
  onEditTask: (task: TrackerTaskRecord) => void;
}) {
  return (
    <div className="space-y-3">
      {overdueTasks.length > 0 ? (
        <div className="rounded-[1.9rem] border border-rose-300 bg-rose-50/80 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-rose-600">
                เลยกำหนด Deadline
              </p>
              <h3 className="mt-1 font-display text-xl font-medium tracking-tight text-rose-800">
                {overdueTasks.length} งาน{overdueTasks.length === 1 ? "" : ""} เลยกำหนดส่งแล้ว
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full border border-rose-300 px-4 py-2 text-sm text-rose-600 transition-colors hover:border-rose-500 hover:text-rose-700"
            >
              ปิด
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {overdueTasks.map((task) => {
              const days = getOverdueDays(task);
              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => {
                    onEditTask(task);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-[1.25rem] border border-rose-200 bg-white/70 px-4 py-3 text-left transition-colors hover:border-rose-400"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{task.title}</p>
                    <p className="mt-0.5 text-xs text-rose-600">
                      กำหนด {formatDate(task.dueDate)} · เลยมา {days} วัน
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-700">
                    {days}d late
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      {dueTodayTasks.length > 0 ? (
        <div className="rounded-[1.9rem] border border-amber-300 bg-amber-50/80 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-amber-600">
                ครบกำหนดวันนี้
              </p>
              <h3 className="mt-1 font-display text-xl font-medium tracking-tight text-amber-800">
                {dueTodayTasks.length} งาน{dueTodayTasks.length === 1 ? "" : ""} ครบกำหนดวันนี้
              </h3>
            </div>
            {overdueTasks.length === 0 ? (
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-full border border-amber-300 px-4 py-2 text-sm text-amber-600 transition-colors hover:border-amber-500 hover:text-amber-700"
              >
                ปิด
              </button>
            ) : null}
          </div>
          <div className="mt-3 space-y-2">
            {dueTodayTasks.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => {
                  onEditTask(task);
                }}
                className="flex w-full items-center justify-between gap-3 rounded-[1.25rem] border border-amber-200 bg-white/70 px-4 py-3 text-left transition-colors hover:border-amber-400"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{task.title}</p>
                  <p className="mt-0.5 text-xs text-amber-600">
                    {priorityLabels[task.priority]} · {taskStatusLabels[task.status]}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700">
                  Due today
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
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

function TaskSubtaskDropdown({
  task,
}: {
  task: TrackerTaskRecord;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const progress = getSubtaskProgress(task);

  if (progress.total === 0) {
    return null;
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
      >
        {isOpen ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
        <span className="font-semibold uppercase tracking-[0.18em]">Sub-Tasks</span>
        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium">
          {progress.completed}/{progress.total}
        </span>
      </button>
      {isOpen ? (
        <div className="mt-1.5 space-y-1 pl-4">
          {task.subtasks.map((subtask) => (
            <div key={subtask.id} className="flex items-start gap-2 text-[11px] leading-5 text-muted-foreground">
              <span
                className={cn(
                  "mt-1 inline-flex size-2.5 shrink-0 rounded-full border",
                  subtask.completed ? "border-emerald-500 bg-emerald-500" : "border-border bg-transparent",
                )}
              />
              <span className={cn("line-clamp-1", subtask.completed && "line-through opacity-70")}>
                {subtask.title}
              </span>
            </div>
          ))}
        </div>
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
  const overdueDays = getOverdueDays(task);
  const dueToday = isDueTodayTask(task);
  const hasNoDeadline = !task.dueDate && task.status !== "done";

  return (
    <article
      className={cn(
        "rounded-[1.4rem] border p-3 transition-all sm:p-4",
        dragging
          ? "border-foreground bg-stone-50/50 shadow-[0_16px_40px_rgba(0,0,0,0.12)]"
          : overdueDays > 0
            ? "border-rose-300 bg-rose-50/60 hover:border-rose-500"
            : dueToday
              ? "border-amber-300 bg-amber-50/60 hover:border-amber-500"
              : hasNoDeadline
                ? "border-violet-200 bg-violet-50/50 hover:border-violet-400"
                : "border-border bg-stone-50/50 hover:border-foreground/30",
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground"
          {...dragHandleProps}
        >
          <GripVertical className="size-3.5" />
        </button>
        <div className="min-w-0 flex-1">
          <button type="button" onClick={onEdit} className="w-full text-left">
            <h4 className="text-pretty text-sm font-semibold leading-5 text-foreground">
              {task.title}
            </h4>
          </button>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-medium sm:text-[11px] ${priorityTone[task.priority]}`}
            >
              {priorityLabels[task.priority]}
            </span>
            {task.dueDate ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] sm:text-[11px]",
                  overdueDays > 0
                    ? "border-rose-200 bg-rose-50 font-medium text-rose-700"
                    : dueToday
                      ? "border-amber-200 bg-amber-50 font-medium text-amber-700"
                      : "border-border text-muted-foreground",
                )}
              >
                <CalendarDays className="size-3" />
                {formatDate(task.dueDate)}
                {overdueDays > 0 ? (
                  <span className="font-semibold">({overdueDays}d late)</span>
                ) : null}
                {dueToday ? (
                  <span className="font-semibold">วันนี้</span>
                ) : null}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-600 sm:text-[11px]">
                No deadline
              </span>
            )}
            {task.status === "done" && task.lateDays != null && task.lateDays > 0 ? (
              <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 sm:text-[11px]">
                Done {task.lateDays}d late
              </span>
            ) : null}
            {task.status === "done" && task.lateDays != null && task.lateDays === 0 ? (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 sm:text-[11px]">
                On time
              </span>
            ) : null}
          </div>
          <TaskSubtaskDropdown task={task} />
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
  const overdueDays = getOverdueDays(task);
  const dueToday = isDueTodayTask(task);
  const hasNoDeadline = !task.dueDate && task.status !== "done";

  return (
    <button
      type="button"
      onClick={onEdit}
      className={cn(
        "flex w-full flex-col gap-2 rounded-[1.5rem] border bg-background px-5 py-3 text-left transition-all",
        overdueDays > 0
          ? "border-rose-300 bg-rose-50/50 hover:border-rose-500"
          : dueToday
            ? "border-amber-300 bg-amber-50/50 hover:border-amber-500"
            : hasNoDeadline
              ? "border-violet-200 bg-violet-50/50 hover:border-violet-400"
              : "border-border hover:border-foreground/30",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] font-medium sm:text-sm">{task.title}</p>
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
        {task.dueDate ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs",
              overdueDays > 0
                ? "font-medium text-rose-600"
                : dueToday
                  ? "font-medium text-amber-600"
                  : "text-muted-foreground",
            )}
          >
            <CalendarDays className="size-3" />
            {formatDate(task.dueDate)}
            {overdueDays > 0 ? ` (${overdueDays}d late)` : ""}
            {dueToday ? " (วันนี้)" : ""}
          </span>
        ) : (
          <span className="text-[0.7rem] font-medium text-violet-600">No deadline</span>
        )}
        {task.status === "done" && task.lateDays != null && task.lateDays > 0 ? (
          <span className="text-[0.7rem] font-semibold text-rose-600">
            Done {task.lateDays}d late
          </span>
        ) : null}
        {task.status === "done" && task.lateDays != null && task.lateDays === 0 ? (
          <span className="text-[0.7rem] font-medium text-emerald-600">On time</span>
        ) : null}
      </div>
    </button>
  );
}
