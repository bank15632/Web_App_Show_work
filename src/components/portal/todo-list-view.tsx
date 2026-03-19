"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  CalendarClock,
  Check,
  ChevronDown,
  Circle,
  Columns3,
  LayoutList,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import {
  getDefaultTodos,
  getProjects,
  type TodoPriority,
} from "@/lib/portal-data";

type TrackerPhaseId = "concept" | "schematic" | "dd" | "cd" | "bidding" | "ca";
type TrackerTaskStatus = "todo" | "progress" | "review" | "done";

type TrackerTask = {
  id: string;
  title: string;
  status: TrackerTaskStatus;
  priority: TodoPriority;
  dueDate?: string;
  notes?: string;
  aiGenerated?: boolean;
};

type TrackerProject = {
  id: string;
  name: string;
  code?: string;
  sourceSlug?: string;
  phase: TrackerPhaseId;
  tasks: TrackerTask[];
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const STORAGE_KEY = "bnj-arch-tracker-projects";

const PHASES: { id: TrackerPhaseId; name: string; icon: string; tone: string; ring: string }[] = [
  { id: "concept", name: "Concept Design", icon: "💡", tone: "bg-stone-100 text-stone-700", ring: "ring-stone-200" },
  { id: "schematic", name: "Schematic Design", icon: "📐", tone: "bg-zinc-100 text-zinc-700", ring: "ring-zinc-200" },
  { id: "dd", name: "Design Development", icon: "🏗️", tone: "bg-amber-50 text-amber-700", ring: "ring-amber-200" },
  { id: "cd", name: "Construction Documents", icon: "📋", tone: "bg-neutral-100 text-neutral-700", ring: "ring-neutral-200" },
  { id: "bidding", name: "Bidding & Negotiation", icon: "💰", tone: "bg-stone-100 text-stone-700", ring: "ring-stone-200" },
  { id: "ca", name: "Construction Admin", icon: "🔨", tone: "bg-emerald-50 text-emerald-700", ring: "ring-emerald-200" },
];

const STATUS = {
  todo: "รอดำเนินการ",
  progress: "กำลังทำ",
  review: "รอตรวจ",
  done: "เสร็จแล้ว",
} satisfies Record<TrackerTaskStatus, string>;

const PRIORITY = {
  high: "สูง",
  medium: "กลาง",
  low: "ต่ำ",
} satisfies Record<TodoPriority, string>;

const STATUS_STYLES: Record<TrackerTaskStatus, string> = {
  todo: "border-stone-300 bg-stone-100 text-stone-700",
  progress: "border-sky-200 bg-sky-50 text-sky-700",
  review: "border-amber-200 bg-amber-50 text-amber-700",
  done: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const PRIORITY_STYLES: Record<TodoPriority, string> = {
  high: "bg-red-500 text-white",
  medium: "bg-amber-500 text-white",
  low: "bg-stone-300 text-stone-700",
};

const AI_SUGGESTIONS: Record<TrackerPhaseId, string[]> = {
  concept: [
    "สำรวจและวิเคราะห์ Site Analysis",
    "จัดทำ Program Requirements กับลูกค้า",
    "ศึกษากฎหมาย ข้อบัญญัติท้องถิ่น และ FAR",
    "ร่าง Massing Study 3 แนวทาง",
  ],
  schematic: [
    "พัฒนา Floor Plan ทุกชั้น",
    "ออกแบบ Section และ Elevation เบื้องต้น",
    "ประสานงานวิศวกรโครงสร้าง เพื่อกำหนด Grid Line",
    "จัดทำ 3D Model เบื้องต้น",
  ],
  dd: [
    "พัฒนารายละเอียด Floor Plan ทุกชั้น",
    "ออกแบบ Interior Layout และ Furniture Plan",
    "กำหนด Material Specification เบื้องต้น",
    "จัดทำ Reflected Ceiling Plan",
  ],
  cd: [
    "จัดทำ Construction Drawing Set ครบชุด",
    "จัดทำ Detail Drawing ทุกจุดสำคัญ",
    "จัดทำ BOQ (Bill of Quantities)",
    "ตรวจสอบความสอดคล้อง Arch-Structure-MEP",
  ],
  bidding: [
    "จัดเตรียมเอกสารประกวดราคา",
    "คัดเลือกผู้รับเหมา (Shortlist)",
    "ตอบ RFI จากผู้รับเหมา",
    "วิเคราะห์ราคาเปรียบเทียบ (Bid Analysis)",
  ],
  ca: [
    "ตรวจงานก่อสร้างประจำสัปดาห์ (Site Inspection)",
    "ตรวจสอบ Shop Drawing จากผู้รับเหมา",
    "ตอบ RFI ระหว่างก่อสร้าง",
    "จัดทำ Punch List ก่อนส่งมอบ",
  ],
};

function generateId() {
  return `tracker-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

function isOverdue(value?: string) {
  if (!value) return false;
  const due = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

function mapProjectPhase(stage: string): TrackerPhaseId {
  switch (stage) {
    case "concept":
      return "concept";
    case "revision":
      return "dd";
    case "construction":
      return "ca";
    default:
      return "cd";
  }
}

function mapTodoStatus(status: string): TrackerTaskStatus {
  switch (status) {
    case "pending":
      return "todo";
    case "in-progress":
      return "progress";
    case "completed":
      return "done";
    default:
      return "todo";
  }
}

function createInitialProjects(): TrackerProject[] {
  const todos = getDefaultTodos();
  return getProjects().map((project) => ({
    id: project.slug,
    name: project.title,
    code: project.code,
    sourceSlug: project.slug,
    phase: mapProjectPhase(project.stage),
    tasks: todos
      .filter((todo) => todo.projectSlug === project.slug)
      .map((todo) => ({
        id: todo.id,
        title: todo.title,
        status: mapTodoStatus(todo.status),
        priority: todo.priority,
        dueDate: todo.completedAt ?? todo.createdAt,
        notes: todo.description,
        aiGenerated: false,
      })),
  }));
}

function loadProjects() {
  if (typeof window === "undefined") return createInitialProjects();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as TrackerProject[];
  } catch {
    // ignore malformed local state
  }
  const initial = createInitialProjects();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

function saveProjects(projects: TrackerProject[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function getAssistantGreeting(project: TrackerProject) {
  const phase = PHASES.find((item) => item.id === project.phase);
  return {
    role: "assistant" as const,
    content: `สวัสดีครับ! ผมพร้อมช่วยจัดการโปรเจกต์ “${project.name}” ในขั้นตอน ${phase?.name ?? "Project Phase"}` ,
  };
}

const INITIAL_PROJECTS = createInitialProjects();

function AIChatPanel({
  project,
  onAddTasks,
  onClose,
}: {
  project: TrackerProject;
  onAddTasks: (tasks: TrackerTask[]) => void;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [getAssistantGreeting(project)]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestedTasks, setSuggestedTasks] = useState<TrackerTask[]>([]);
  const endRef = useRef<HTMLDivElement | null>(null);

  const phase = PHASES.find((item) => item.id === project.phase);


  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, suggestedTasks, loading]);

  const processAI = useCallback(
    async (prompt: string) => {
      setLoading(true);
      setMessages((prev) => [...prev, { role: "user", content: prompt }]);
      await new Promise((resolve) => setTimeout(resolve, 700));

      const currentTasks = project.tasks;
      const overdue = currentTasks.filter((task) => task.status !== "done" && isOverdue(task.dueDate));
      const highPriority = currentTasks.filter((task) => task.priority === "high" && task.status !== "done");
      let response = "";

      if (prompt.includes("แนะนำ") || /task/i.test(prompt)) {
        const suggestions = (AI_SUGGESTIONS[project.phase] ?? []).filter(
          (item) => !currentTasks.some((task) => task.title.toLowerCase().includes(item.slice(0, 10).toLowerCase())),
        );
        const nextSuggested = suggestions.slice(0, 4).map((item) => ({
          id: generateId(),
          title: item,
          status: "todo" as const,
          priority: "medium" as const,
          notes: "AI แนะนำ",
          aiGenerated: true,
        }));
        setSuggestedTasks(nextSuggested);
        response = `ผมคัด task ที่เหมาะกับช่วง ${phase?.name ?? "นี้"} มาให้แล้ว ${nextSuggested.length} รายการ กดเพิ่มทั้งหมดได้ทันทีครับ`;
      } else if (prompt.includes("เสี่ยง") || /risk/i.test(prompt)) {
        response = `สรุปความเสี่ยงของ ${project.name}\n\n`;
        response += overdue.length
          ? `• งานเลยกำหนด ${overdue.length} รายการ\n${overdue.map((task) => `  - ${task.title}`).join("\n")}\n\n`
          : "• ยังไม่พบงานเลยกำหนด\n\n";
        response += highPriority.length
          ? `• งานสำคัญสูงที่ยังไม่เสร็จ ${highPriority.length} รายการ\n${highPriority.map((task) => `  - ${task.title}`).join("\n")}`
          : "• งาน high priority อยู่ในระดับควบคุมได้";
      } else if (prompt.includes("สรุป") || prompt.includes("สถานะ") || /summary/i.test(prompt)) {
        const doneCount = currentTasks.filter((task) => task.status === "done").length;
        const totalCount = currentTasks.length;
        const percent = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;
        response = `โปรเจกต์ ${project.name}\n• Phase: ${phase?.name ?? "-"}\n• Progress: ${doneCount}/${totalCount} งาน (${percent}%)\n• Todo: ${currentTasks.filter((task) => task.status === "todo").length}\n• In Progress: ${currentTasks.filter((task) => task.status === "progress").length}\n• Review: ${currentTasks.filter((task) => task.status === "review").length}\n• Done: ${doneCount}`;
      } else {
        response = `ผมช่วยได้ทั้งแนะนำ task, สรุปสถานะ และวิเคราะห์ความเสี่ยงสำหรับโปรเจกต์นี้ครับ ลองกด quick action ด้านบนได้เลย`;
      }

      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
      setLoading(false);
    },
    [phase?.name, project],
  );

  function handleAdd(tasks: TrackerTask[]) {
    onAddTasks(tasks);
    setSuggestedTasks([]);
    setMessages((prev) => [...prev, { role: "assistant", content: `เพิ่ม ${tasks.length} task เข้าโปรเจกต์แล้วครับ` }]);
  }

  return (
    <aside className="flex h-full w-full max-w-[22rem] flex-col border-l border-border bg-muted/40">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-full border border-border bg-background">
            <Bot className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">AI Assistant</p>
            <p className="text-xs text-muted-foreground">Project copilot</p>
          </div>
        </div>
        <button onClick={onClose} className="rounded-full border border-border p-2 text-muted-foreground transition-colors hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 border-b border-border px-5 py-4">
        {[
          "แนะนำ task สำหรับ phase นี้",
          "วิเคราะห์ความเสี่ยง",
          "สรุปสถานะโปรเจกต์",
          "แนะนำ checklist ก่อนส่งงาน",
        ].map((label) => (
          <button
            key={label}
            onClick={() => processAI(label)}
            className="rounded-2xl border border-border bg-background px-3 py-2 text-left text-xs transition-colors hover:border-foreground/30 hover:bg-secondary"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={message.role === "user" ? "ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-foreground px-4 py-3 text-sm text-background" : "max-w-[90%] rounded-2xl rounded-bl-md border border-border bg-background px-4 py-3 text-sm text-foreground"}
          >
            <p className="whitespace-pre-wrap leading-6">{message.content}</p>
          </div>
        ))}

        {suggestedTasks.length > 0 && (
          <div className="rounded-[1.5rem] border border-border bg-background p-4">
            <button
              onClick={() => handleAdd(suggestedTasks)}
              className="mb-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-foreground bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
            >
              <Plus className="size-4" /> เพิ่มทั้งหมด {suggestedTasks.length} รายการ
            </button>
            <div className="space-y-2">
              {suggestedTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border px-3 py-2">
                  <p className="text-sm leading-5">{task.title}</p>
                  <button
                    onClick={() => handleAdd([task])}
                    className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                  >
                    เพิ่ม
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="max-w-[90%] rounded-2xl rounded-bl-md border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-border px-5 py-4">
        <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && input.trim() && (processAI(input.trim()), setInput(""))}
            placeholder="พิมพ์คำถามถึง AI..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={() => {
              if (!input.trim()) return;
              processAI(input.trim());
              setInput("");
            }}
            className="inline-flex size-8 items-center justify-center rounded-full bg-foreground text-background"
          >
            <Sparkles className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 px-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-[2rem] border border-border bg-background p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-2xl font-medium tracking-tight">{title}</h3>
          <button onClick={onClose} className="rounded-full border border-border p-2 text-muted-foreground transition-colors hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function TodoListView() {
  const [projects, setProjects] = useState<TrackerProject[]>(INITIAL_PROJECTS);
  const [mounted, setMounted] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState(INITIAL_PROJECTS[0]?.id ?? "");
  const [showAI, setShowAI] = useState(false);
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [filterStatus, setFilterStatus] = useState<"all" | TrackerTaskStatus>("all");
  const [showNewTask, setShowNewTask] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [editingTask, setEditingTask] = useState<TrackerTask | null>(null);
  const [newTask, setNewTask] = useState<Omit<TrackerTask, "id">>({
    title: "",
    status: "todo",
    priority: "medium",
    dueDate: "",
    notes: "",
    aiGenerated: false,
  });
  const [newProject, setNewProject] = useState({ name: "", phase: "concept" as TrackerPhaseId });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const initial = loadProjects();
      setProjects(initial);
      setActiveProjectId((current) => current || initial[0]?.id || "");
      setMounted(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const updateProjects = useCallback((updater: (prev: TrackerProject[]) => TrackerProject[]) => {
    setProjects((prev) => {
      const next = updater(prev);
      saveProjects(next);
      return next;
    });
  }, []);

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? null,
    [activeProjectId, projects],
  );

  const activePhase = PHASES.find((phase) => phase.id === activeProject?.phase);

  const filteredTasks = useMemo(() => {
    if (!activeProject) return [];
    return activeProject.tasks.filter((task) => filterStatus === "all" || task.status === filterStatus);
  }, [activeProject, filterStatus]);

  const progress = activeProject?.tasks.length
    ? Math.round((activeProject.tasks.filter((task) => task.status === "done").length / activeProject.tasks.length) * 100)
    : 0;

  function updateTask(taskId: string, updates: Partial<TrackerTask>) {
    updateProjects((prev) =>
      prev.map((project) =>
        project.id === activeProjectId
          ? {
              ...project,
              tasks: project.tasks.map((task) => (task.id === taskId ? { ...task, ...updates } : task)),
            }
          : project,
      ),
    );
  }

  function addTask(task: Omit<TrackerTask, "id">) {
    updateProjects((prev) =>
      prev.map((project) =>
        project.id === activeProjectId ? { ...project, tasks: [{ ...task, id: generateId() }, ...project.tasks] } : project,
      ),
    );
  }

  function deleteTask(taskId: string) {
    updateProjects((prev) =>
      prev.map((project) =>
        project.id === activeProjectId ? { ...project, tasks: project.tasks.filter((task) => task.id !== taskId) } : project,
      ),
    );
    setEditingTask(null);
  }

  function addProject() {
    if (!newProject.name.trim()) return;
    const project: TrackerProject = {
      id: generateId(),
      name: newProject.name.trim(),
      phase: newProject.phase,
      tasks: [],
    };
    updateProjects((prev) => [...prev, project]);
    setActiveProjectId(project.id);
    setShowNewProject(false);
    setNewProject({ name: "", phase: "concept" });
  }

  function cycleStatus(taskId: string) {
    if (!activeProject) return;
    const order: TrackerTaskStatus[] = ["todo", "progress", "review", "done"];
    const current = activeProject.tasks.find((task) => task.id === taskId);
    if (!current) return;
    const next = order[(order.indexOf(current.status) + 1) % order.length];
    updateTask(taskId, { status: next });
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-[10px]">
        <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-6 py-5 lg:px-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-bnj.svg" alt="BNJ Studio" width={120} height={60} className="h-10 w-auto shrink-0" />
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold tracking-tight">Todo List</p>
            <p className="caption-editorial text-xs">Project tracker with AI workflows</p>
          </div>
          <Link href="/" className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground">
            <ArrowLeft className="size-3.5" /> Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px] gap-0 lg:min-h-[calc(100vh-81px)]">
        <aside className="hidden w-[300px] shrink-0 border-r border-border bg-muted/20 lg:flex lg:flex-col">
          <div className="border-b border-border px-6 py-6">
            <p className="caption-editorial text-xs">Projects</p>
            <h1 className="mt-2 font-display text-3xl font-medium tracking-tight">Studio Task Tracker</h1>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {projects.map((project) => {
              const phase = PHASES.find((item) => item.id === project.phase);
              const doneCount = project.tasks.filter((task) => task.status === "done").length;
              const percent = project.tasks.length ? Math.round((doneCount / project.tasks.length) * 100) : 0;
              const isActive = project.id === activeProjectId;
              return (
                <button
                  key={project.id}
                  onClick={() => {
                    setActiveProjectId(project.id);
                    setShowAI(false);
                  }}
                  className={`w-full rounded-[1.5rem] border p-4 text-left transition-all duration-200 ${isActive ? "border-foreground bg-background shadow-[0_12px_40px_rgba(0,0,0,0.06)]" : "border-border bg-background hover:border-foreground/30"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">{project.code ?? "Custom Project"}</p>
                      <p className="mt-1 text-sm font-medium leading-6">{project.name}</p>
                    </div>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[0.7rem] font-medium ${phase?.tone}`}>{phase?.icon} {phase?.id.toUpperCase()}</span>
                  </div>
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{phase?.name}</span>
                      <span>{percent}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary">
                      <div className="h-2 rounded-full bg-foreground transition-all" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="space-y-3 border-t border-border p-4">
            <button onClick={() => setShowNewProject(true)} className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:border-foreground">
              <Plus className="size-4" /> เพิ่มโปรเจกต์
            </button>
            <button onClick={() => setShowAI((prev) => !prev)} className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${showAI ? "bg-foreground text-background" : "border border-border bg-background text-foreground hover:border-foreground"}`}>
              <Bot className="size-4" /> AI Assistant
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-6 py-8 lg:px-10">
          {activeProject ? (
            <>
              <section className="rounded-[2rem] border border-border bg-muted/20 p-6 sm:p-8">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <p className="caption-editorial text-xs">Active Project</p>
                    <h2 className="mt-2 font-display text-4xl font-medium tracking-tight sm:text-5xl">{activeProject.name}</h2>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${activePhase?.tone} ${activePhase?.ring}`}>
                        {activePhase?.icon} {activePhase?.name}
                      </span>
                      <span className="text-sm text-muted-foreground">{activeProject.tasks.length} งาน · {activeProject.tasks.filter((task) => task.status === "done").length} เสร็จ</span>
                      {activeProject.sourceSlug && (
                        <Link href={`/p/${activeProject.sourceSlug}`} className="text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground">
                          เปิดหน้าโปรเจกต์
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                      <select
                        value={activeProject.phase}
                        onChange={(event) => updateProjects((prev) => prev.map((project) => project.id === activeProjectId ? { ...project, phase: event.target.value as TrackerPhaseId } : project))}
                        className="h-11 appearance-none rounded-full border border-border bg-background pl-4 pr-10 text-sm font-medium text-foreground transition-all duration-300 hover:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                      >
                        {PHASES.map((phase) => (
                          <option key={phase.id} value={phase.id}>{phase.icon} {phase.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                    <button onClick={() => setShowNewTask(true)} className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/90">
                      <Plus className="size-4" /> เพิ่มงาน
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  {(["all", "todo", "progress", "review", "done"] as const).map((status) => {
                    const count = status === "all" ? activeProject.tasks.length : activeProject.tasks.filter((task) => task.status === status).length;
                    const label = status === "all" ? "ทั้งหมด" : STATUS[status];
                    return (
                      <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`rounded-[1.5rem] border p-4 text-left transition-all ${filterStatus === status ? "border-foreground bg-background shadow-[0_10px_30px_rgba(0,0,0,0.05)]" : "border-border bg-background hover:border-foreground/30"}`}
                      >
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="mt-2 font-display text-3xl font-medium">{count}</p>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary md:max-w-xl">
                    <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="flex items-center gap-2 self-end rounded-full border border-border bg-background p-1">
                    <button onClick={() => setViewMode("board")} className={`inline-flex size-9 items-center justify-center rounded-full ${viewMode === "board" ? "bg-foreground text-background" : "text-muted-foreground"}`}><Columns3 className="size-4" /></button>
                    <button onClick={() => setViewMode("list")} className={`inline-flex size-9 items-center justify-center rounded-full ${viewMode === "list" ? "bg-foreground text-background" : "text-muted-foreground"}`}><LayoutList className="size-4" /></button>
                  </div>
                </div>
              </section>

              <section className="mt-8">
                {viewMode === "board" ? (
                  <div className="grid gap-4 xl:grid-cols-4">
                    {(Object.entries(STATUS) as [TrackerTaskStatus, string][]).map(([statusKey, statusLabel]) => {
                      if (filterStatus !== "all" && filterStatus !== statusKey) return null;
                      const tasks = filteredTasks.filter((task) => task.status === statusKey);
                      return (
                        <div key={statusKey} className="rounded-[1.75rem] border border-border bg-background">
                          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
                            <span className={`inline-flex size-2.5 rounded-full ${statusKey === "todo" ? "bg-stone-400" : statusKey === "progress" ? "bg-sky-400" : statusKey === "review" ? "bg-amber-400" : "bg-emerald-400"}`} />
                            <span className="text-sm font-medium">{statusLabel}</span>
                            <span className="ml-auto rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">{tasks.length}</span>
                          </div>
                          <div className="space-y-3 p-4">
                            {tasks.length === 0 ? <p className="rounded-[1.25rem] border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">ยังไม่มีงานในสถานะนี้</p> : null}
                            {tasks.map((task) => (
                              <article key={task.id} className="rounded-[1.5rem] border border-border bg-muted/30 p-4 transition-all hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
                                <div className="flex items-start justify-between gap-3">
                                  <button onClick={() => setEditingTask(task)} className="text-left">
                                    <h3 className="text-sm font-medium leading-6">{task.title}</h3>
                                  </button>
                                  {task.aiGenerated ? <span className="rounded-full border border-border bg-background px-2 py-1 text-[0.65rem] font-medium">AI</span> : null}
                                </div>
                                {task.notes ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{task.notes}</p> : null}
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                  <span className={`rounded-full px-2.5 py-1 text-[0.7rem] font-medium ${PRIORITY_STYLES[task.priority]}`}>{PRIORITY[task.priority]}</span>
                                  {task.dueDate ? (
                                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.7rem] ${isOverdue(task.dueDate) && task.status !== "done" ? "border-red-200 bg-red-50 text-red-600" : "border-border bg-background text-muted-foreground"}`}>
                                      <CalendarClock className="size-3" /> {formatDate(task.dueDate)}
                                    </span>
                                  ) : null}
                                </div>
                                <div className="mt-4 flex items-center gap-2">
                                  <button onClick={() => cycleStatus(task.id)} className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground">
                                    <Circle className="size-3" /> {task.status === "done" ? "เปิดใหม่" : "ไปขั้นถัดไป"}
                                  </button>
                                  <button onClick={() => setEditingTask(task)} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                                    <Pencil className="size-3" /> แก้ไข
                                  </button>
                                </div>
                              </article>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTasks.map((task) => (
                      <article key={task.id} className="flex flex-wrap items-center gap-4 rounded-[1.5rem] border border-border bg-background px-5 py-4 transition-all hover:border-foreground/30 hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
                        <button onClick={() => cycleStatus(task.id)} className={`inline-flex size-9 items-center justify-center rounded-full border ${STATUS_STYLES[task.status]}`}>
                          {task.status === "done" ? <Check className="size-4" /> : <Circle className="size-4" />}
                        </button>
                        <button onClick={() => setEditingTask(task)} className="min-w-0 flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <h3 className={`text-sm font-medium leading-6 ${task.status === "done" ? "text-muted-foreground line-through" : "text-foreground"}`}>{task.title}</h3>
                            {task.aiGenerated ? <span className="rounded-full border border-border px-2 py-0.5 text-[0.65rem] font-medium">AI</span> : null}
                          </div>
                          {task.notes ? <p className="mt-1 text-sm text-muted-foreground">{task.notes}</p> : null}
                        </button>
                        <span className={`rounded-full px-2.5 py-1 text-[0.7rem] font-medium ${PRIORITY_STYLES[task.priority]}`}>{PRIORITY[task.priority]}</span>
                        <span className={`rounded-full border px-2.5 py-1 text-[0.7rem] font-medium ${STATUS_STYLES[task.status]}`}>{STATUS[task.status]}</span>
                        {task.dueDate ? <span className={`text-xs ${isOverdue(task.dueDate) && task.status !== "done" ? "text-red-600" : "text-muted-foreground"}`}>{formatDate(task.dueDate)}</span> : null}
                      </article>
                    ))}
                    {filteredTasks.length === 0 ? <p className="rounded-[1.5rem] border border-dashed border-border px-4 py-10 text-center text-muted-foreground">ยังไม่มีรายการที่ตรงกับตัวกรองนี้</p> : null}
                  </div>
                )}
              </section>
            </>
          ) : null}
        </main>

        {showAI && activeProject ? <AIChatPanel key={activeProject.id} project={activeProject} onAddTasks={(tasks) => tasks.forEach((task) => addTask(task))} onClose={() => setShowAI(false)} /> : null}
      </div>

      {showNewTask ? (
        <ModalShell title="เพิ่มงานใหม่" onClose={() => setShowNewTask(false)}>
          <div className="space-y-4">
            <input value={newTask.title} onChange={(event) => setNewTask((prev) => ({ ...prev, title: event.target.value }))} placeholder="ชื่องาน..." className="h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition-colors focus:border-foreground" autoFocus />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="relative">
                <select value={newTask.priority} onChange={(event) => setNewTask((prev) => ({ ...prev, priority: event.target.value as TodoPriority }))} className="h-11 w-full appearance-none rounded-2xl border border-border bg-background px-4 text-sm outline-none transition-colors focus:border-foreground">
                  {Object.entries(PRIORITY).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>
              <input type="date" value={newTask.dueDate} onChange={(event) => setNewTask((prev) => ({ ...prev, dueDate: event.target.value }))} className="h-11 rounded-2xl border border-border bg-background px-4 text-sm outline-none transition-colors focus:border-foreground" />
            </div>
            <textarea value={newTask.notes} onChange={(event) => setNewTask((prev) => ({ ...prev, notes: event.target.value }))} placeholder="บันทึกเพิ่มเติม..." rows={4} className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-foreground" />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowNewTask(false)} className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground">ยกเลิก</button>
              <button onClick={() => {
                if (!newTask.title.trim()) return;
                addTask({ ...newTask, title: newTask.title.trim() });
                setNewTask({ title: "", status: "todo", priority: "medium", dueDate: "", notes: "", aiGenerated: false });
                setShowNewTask(false);
              }} className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90">บันทึก</button>
            </div>
          </div>
        </ModalShell>
      ) : null}

      {editingTask ? (
        <ModalShell title="แก้ไขงาน" onClose={() => setEditingTask(null)}>
          <div className="space-y-4">
            <input value={editingTask.title} onChange={(event) => setEditingTask((prev) => prev ? { ...prev, title: event.target.value } : prev)} className="h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition-colors focus:border-foreground" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="relative">
                <select value={editingTask.status} onChange={(event) => setEditingTask((prev) => prev ? { ...prev, status: event.target.value as TrackerTaskStatus } : prev)} className="h-11 w-full appearance-none rounded-2xl border border-border bg-background px-4 text-sm outline-none transition-colors focus:border-foreground">
                  {Object.entries(STATUS).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>
              <div className="relative">
                <select value={editingTask.priority} onChange={(event) => setEditingTask((prev) => prev ? { ...prev, priority: event.target.value as TodoPriority } : prev)} className="h-11 w-full appearance-none rounded-2xl border border-border bg-background px-4 text-sm outline-none transition-colors focus:border-foreground">
                  {Object.entries(PRIORITY).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
            <input type="date" value={editingTask.dueDate ?? ""} onChange={(event) => setEditingTask((prev) => prev ? { ...prev, dueDate: event.target.value } : prev)} className="h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition-colors focus:border-foreground" />
            <textarea value={editingTask.notes ?? ""} onChange={(event) => setEditingTask((prev) => prev ? { ...prev, notes: event.target.value } : prev)} rows={4} className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-foreground" />
            <div className="flex justify-between gap-3">
              <button onClick={() => deleteTask(editingTask.id)} className="rounded-full border border-red-200 px-5 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"><Trash2 className="mr-1 inline size-4" />ลบ</button>
              <div className="flex gap-3">
                <button onClick={() => setEditingTask(null)} className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground">ยกเลิก</button>
                <button onClick={() => {
                  updateTask(editingTask.id, editingTask);
                  setEditingTask(null);
                }} className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90">บันทึก</button>
              </div>
            </div>
          </div>
        </ModalShell>
      ) : null}

      {showNewProject ? (
        <ModalShell title="โปรเจกต์ใหม่" onClose={() => setShowNewProject(false)}>
          <div className="space-y-4">
            <input value={newProject.name} onChange={(event) => setNewProject((prev) => ({ ...prev, name: event.target.value }))} placeholder="ชื่อโปรเจกต์..." className="h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition-colors focus:border-foreground" autoFocus />
            <div className="relative">
              <select value={newProject.phase} onChange={(event) => setNewProject((prev) => ({ ...prev, phase: event.target.value as TrackerPhaseId }))} className="h-11 w-full appearance-none rounded-2xl border border-border bg-background px-4 text-sm outline-none transition-colors focus:border-foreground">
                {PHASES.map((phase) => <option key={phase.id} value={phase.id}>{phase.icon} {phase.name}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowNewProject(false)} className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground">ยกเลิก</button>
              <button onClick={addProject} className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90">สร้าง</button>
            </div>
          </div>
        </ModalShell>
      ) : null}
    </div>
  );
}
