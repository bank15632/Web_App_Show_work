"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Circle,
  Clock,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import {
  type TodoItem,
  type TodoPriority,
  type TodoStatus,
  getDefaultTodos,
  getProjectBySlug,
  getProjects,
  getTodoPriorityLabel,
  getTodoStatusLabel,
} from "@/lib/portal-data";

/* ── Constants ────────────────────────────────────────── */

const STORAGE_KEY = "bnj-todos";

type FilterStatus = "all" | TodoStatus;

const statusIcons: Record<TodoStatus, typeof Circle> = {
  pending: Circle,
  "in-progress": Loader2,
  completed: Check,
};

const statusStyles: Record<TodoStatus, string> = {
  pending: "border-amber-300 bg-amber-50 text-amber-700",
  "in-progress": "border-blue-300 bg-blue-50 text-blue-700",
  completed: "border-emerald-300 bg-emerald-50 text-emerald-700",
};

const priorityStyles: Record<TodoPriority, string> = {
  low: "border-border bg-secondary/50 text-muted-foreground",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  high: "border-red-200 bg-red-50 text-red-700",
};

/* ── Helpers ──────────────────────────────────────────── */

function loadTodos(): TodoItem[] {
  if (typeof window === "undefined") return getDefaultTodos();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    /* ignore */
  }
  const defaults = getDefaultTodos();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
  return defaults;
}

function saveTodos(todos: TodoItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function generateId() {
  return `todo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/* ── Main Component ───────────────────────────────────── */

export function TodoListView() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [showAddForm, setShowAddForm] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setTodos(loadTodos());
    setMounted(true);
  }, []);

  // Save whenever todos change
  const updateTodos = useCallback((updater: (prev: TodoItem[]) => TodoItem[]) => {
    setTodos((prev) => {
      const next = updater(prev);
      saveTodos(next);
      return next;
    });
  }, []);

  const filteredTodos = useMemo(() => {
    if (filterStatus === "all") return todos;
    return todos.filter((t) => t.status === filterStatus);
  }, [todos, filterStatus]);

  const counts = useMemo(() => {
    const c = { all: todos.length, pending: 0, "in-progress": 0, completed: 0 };
    for (const t of todos) c[t.status]++;
    return c;
  }, [todos]);

  function cycleStatus(id: string) {
    updateTodos((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const next: TodoStatus =
          t.status === "pending"
            ? "in-progress"
            : t.status === "in-progress"
              ? "completed"
              : "pending";
        return {
          ...t,
          status: next,
          completedAt: next === "completed" ? new Date().toISOString().slice(0, 10) : undefined,
        };
      }),
    );
  }

  function deleteTodo(id: string) {
    updateTodos((prev) => prev.filter((t) => t.id !== id));
  }

  function addTodo(item: Omit<TodoItem, "id" | "createdAt">) {
    const newTodo: TodoItem = {
      ...item,
      id: generateId(),
      createdAt: new Date().toISOString().slice(0, 10),
    };
    updateTodos((prev) => [newTodo, ...prev]);
    setShowAddForm(false);
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
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
              Todo List
            </p>
            <p className="caption-editorial text-xs">จัดการรายการงาน</p>
          </div>
          <Link
            href="/"
            className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1320px] space-y-8 px-6 py-12 lg:px-10">
        {/* Title + Add button */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="caption-editorial mb-2">Tasks</p>
            <h1 className="font-display text-4xl font-medium tracking-tight sm:text-5xl">
              รายการสิ่งที่ต้องทำ
            </h1>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            <Plus className="size-4" />
            เพิ่มรายการ
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid gap-3 sm:grid-cols-4">
          {(["all", "pending", "in-progress", "completed"] as FilterStatus[]).map(
            (status) => {
              const isActive = filterStatus === status;
              const label =
                status === "all" ? "ทั้งหมด" : getTodoStatusLabel(status);
              return (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`rounded-lg border p-4 text-left transition-all duration-200 ${
                    isActive
                      ? "border-foreground bg-foreground/5 ring-1 ring-foreground/10"
                      : "border-border hover:border-foreground/30"
                  }`}
                >
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-1 font-display text-2xl font-medium">
                    {counts[status]}
                  </p>
                </button>
              );
            },
          )}
        </div>

        {/* Add form */}
        {showAddForm && (
          <AddTodoForm
            onAdd={addTodo}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {/* Todo list */}
        <div className="space-y-3">
          {filteredTodos.length === 0 && (
            <div className="rounded-lg border border-border p-12 text-center">
              <p className="text-lg text-muted-foreground">
                {filterStatus === "all"
                  ? "ยังไม่มีรายการ — เพิ่มรายการแรกของคุณ"
                  : `ไม่มีรายการที่สถานะ "${getTodoStatusLabel(filterStatus)}"`}
              </p>
            </div>
          )}

          {filteredTodos.map((todo) => {
            const project = todo.projectSlug
              ? getProjectBySlug(todo.projectSlug)
              : null;
            const StatusIcon = statusIcons[todo.status];

            return (
              <div
                key={todo.id}
                className={`group flex items-start gap-4 rounded-lg border border-border bg-background p-5 transition-all duration-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] ${
                  todo.status === "completed" ? "opacity-60" : ""
                }`}
              >
                {/* Status toggle */}
                <button
                  onClick={() => cycleStatus(todo.id)}
                  className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors ${statusStyles[todo.status]}`}
                  title={`สถานะ: ${getTodoStatusLabel(todo.status)} — คลิกเพื่อเปลี่ยน`}
                >
                  <StatusIcon className="size-4" />
                </button>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      className={`font-medium ${
                        todo.status === "completed"
                          ? "text-muted-foreground line-through"
                          : "text-foreground"
                      }`}
                    >
                      {todo.title}
                    </h3>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[0.65rem] font-medium ${priorityStyles[todo.priority]}`}
                    >
                      {getTodoPriorityLabel(todo.priority)}
                    </span>
                  </div>

                  {todo.description && (
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {todo.description}
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {project && (
                      <Link
                        href={`/p/${project.slug}`}
                        className="rounded-full border border-border px-2.5 py-0.5 transition-colors hover:border-foreground hover:text-foreground"
                      >
                        {project.code} — {project.title}
                      </Link>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {todo.createdAt}
                    </span>
                    {todo.completedAt && (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <Check className="size-3" />
                        {todo.completedAt}
                      </span>
                    )}
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="shrink-0 rounded-lg p-2 text-muted-foreground opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                  title="ลบรายการ"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

/* ── Add Todo Form ────────────────────────────────────── */

function AddTodoForm({
  onAdd,
  onCancel,
}: {
  onAdd: (item: Omit<TodoItem, "id" | "createdAt">) => void;
  onCancel: () => void;
}) {
  const projects = getProjects();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TodoPriority>("medium");
  const [projectSlug, setProjectSlug] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      description: description.trim() || undefined,
      status: "pending",
      priority,
      projectSlug: projectSlug || undefined,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-foreground/20 bg-background p-6 shadow-lg"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-medium">เพิ่มรายการใหม่</h3>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">
            หัวข้อ <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="สิ่งที่ต้องทำ..."
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm transition-colors focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
            autoFocus
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">รายละเอียด</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"
            rows={2}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm transition-colors focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">ความสำคัญ</label>
            <div className="relative">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TodoPriority)}
                className="h-10 w-full appearance-none rounded-lg border border-border bg-background pl-3 pr-8 text-sm transition-colors focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
              >
                <option value="low">ต่ำ</option>
                <option value="medium">ปานกลาง</option>
                <option value="high">สูง</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">โปรเจกต์</label>
            <div className="relative">
              <select
                value={projectSlug}
                onChange={(e) => setProjectSlug(e.target.value)}
                className="h-10 w-full appearance-none rounded-lg border border-border bg-background pl-3 pr-8 text-sm transition-colors focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
              >
                <option value="">ไม่ระบุโปรเจกต์</option>
                {projects.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.code} — {p.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:border-foreground"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={!title.trim()}
          className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-40"
        >
          เพิ่มรายการ
        </button>
      </div>
    </form>
  );
}
