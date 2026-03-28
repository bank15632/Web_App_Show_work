"use client";

import { useEffect, useMemo, useState } from "react";
import type { ButtonHTMLAttributes } from "react";
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
import { CalendarDays, GripVertical, List, SquareKanban } from "lucide-react";

import {
  priorityLabels,
  priorityTone,
  taskStatusLabels,
  taskStatusTone,
  taskTypeLabels,
  trackerTaskStatuses,
} from "@/lib/tracker/constants";
import type { TrackerTaskRecord } from "@/lib/tracker/types";
import { isTaskOverdue } from "@/lib/tracker/views";

type ViewMode = "board" | "list";

type BoardState = Record<(typeof trackerTaskStatuses)[number], TrackerTaskRecord[]>;

function buildBoardState(tasks: TrackerTaskRecord[]): BoardState {
  return trackerTaskStatuses.reduce<BoardState>((acc, status) => {
    acc[status] = tasks
      .filter((task) => task.status === status)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    return acc;
  }, {} as BoardState);
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

export function TaskBoard({
  tasks,
  onEditTask,
  onCreateTask,
  onReorder,
}: {
  tasks: TrackerTaskRecord[];
  onEditTask: (task: TrackerTaskRecord) => void;
  onCreateTask: () => void;
  onReorder: (items: Array<{ taskId: string; status: TrackerTaskRecord["status"]; sortOrder: number }>) => Promise<void>;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
      ? "list"
      : "board",
  );
  const [board, setBoard] = useState<BoardState>(() => buildBoardState(tasks));
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor));

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
  return (
    <button
      type="button"
      onClick={onEdit}
      className="flex w-full flex-col gap-3 rounded-[1.5rem] border border-border bg-background px-5 py-4 text-left transition-all hover:border-foreground/30"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium sm:text-sm">{task.title}</p>
          <p className="mt-1 text-[13px] text-muted-foreground sm:text-sm">{task.description}</p>
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
        {task.dueDate ? (
          <span className="text-xs text-muted-foreground">{formatDate(task.dueDate)}</span>
        ) : null}
      </div>
    </button>
  );
}
