"use client";

<<<<<<< ours
<<<<<<< ours
import {
  startTransition,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpenText, ChevronLeft, ChevronRight, Copy } from "lucide-react";
=======
=======
>>>>>>> theirs
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
>>>>>>> theirs

import { DomainTabs } from "@/components/portal/tracker/domain-tabs";
import { ProjectRail } from "@/components/portal/tracker/project-rail";
import { ReviewQueue } from "@/components/portal/tracker/review-queue";
import { SavedViewBar } from "@/components/portal/tracker/saved-view-bar";
import { TaskBoard } from "@/components/portal/tracker/task-board";
import { WeeklyReportPanel } from "@/components/portal/tracker/weekly-report-panel";
import { WorkspaceHeader } from "@/components/portal/tracker/workspace-header";
import {
<<<<<<< ours
<<<<<<< ours
  taskStatusLabels,
  taskTypeLabels,
  trackerStorageKeys,
} from "@/lib/tracker/constants";
import type {
  TrackerArtifactRecord,
  TrackerDomainTab,
  TrackerLegacyTodoImport,
  TrackerProjectDetail,
  TrackerProjectMutationInput,
  TrackerSavedView,
  TrackerTaskMutationInput,
  TrackerTaskRecord,
  TrackerWorkspaceData,
} from "@/lib/tracker/types";
import { cn } from "@/lib/utils";
import { filterTasksForSavedView } from "@/lib/tracker/views";

type DialogState =
  | null
  | "task"
  | "project"
  | "meeting"
  | "log"
  | "upload";

type TaskDraft = TrackerTaskMutationInput;
type ProjectDraft = TrackerProjectMutationInput;

type MeetingDraft = {
  title: string;
  content: string;
};

type LogDraft = {
  title: string;
  kind: "rfi_log" | "submittal_log" | "drawing_revision";
  content: string;
};

type UploadDraft = {
  title: string;
  kind: "site_photo" | "site_markup";
  notes: string;
  file: File | null;
};

async function requestJson<T>(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, init);
  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
  } & T;

  if (!response.ok) {
    throw new Error(data.error || "Tracker request failed");
  }

  return data;
}

function createEmptyTaskDraft(phase: TrackerProjectDetail["phase"]): TaskDraft {
  return {
    phase,
    taskType: "design",
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    assignee: "BNJ Studio",
    dueDate: null,
    location: "",
    revision: "",
    sourceType: "manual",
    sourceRef: "manual",
    sourceArtifactId: null,
    nextAction: "",
    blocker: "",
    humanVerified: true,
  };
}

function createEmptyProjectDraft(): ProjectDraft {
  return {
    name: "",
    phase: "concept",
    status: "active",
    clientName: "",
    code: "",
    projectType: "Internal",
    location: "Bangkok",
    overview: "",
    nextMilestone: "",
    ownerNote: "",
    area: "",
    year: String(new Date().getFullYear()),
  };
}

function createEmptyMeetingDraft(): MeetingDraft {
  return { title: "", content: "" };
}

function createEmptyLogDraft(): LogDraft {
  return { title: "", kind: "drawing_revision", content: "" };
}

function createEmptyUploadDraft(): UploadDraft {
  return { title: "", kind: "site_photo", notes: "", file: null };
}

function formatFullDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function buildAiChatBrief({
  project,
  filteredTasks,
  revisionArtifacts,
  weeklyReports,
  savedView,
  domainTab,
}: {
  project: TrackerProjectDetail;
  filteredTasks: TrackerTaskRecord[];
  revisionArtifacts: TrackerArtifactRecord[];
  weeklyReports: TrackerArtifactRecord[];
  savedView: TrackerSavedView;
  domainTab: TrackerDomainTab;
}) {
  const openTasks = project.tasks.filter((task) => task.status !== "done");
  const lines = [
    "You are helping me review an architecture project tracker.",
    "Use only the approved data below. If something is missing, say so clearly.",
    "",
    "# Project snapshot",
    `Project: ${project.name} (${project.code || project.slug})`,
    `Phase: ${formatLabel(project.phase)}`,
    `Status: ${formatLabel(project.status)}`,
    `Client: ${project.clientName || "BNJ Studio"}`,
    `Location: ${project.location || "Bangkok"}`,
    `Current filter: ${formatLabel(savedView)}`,
    `Current section: ${formatLabel(domainTab)}`,
    `Open tasks: ${openTasks.length}`,
    `Total tasks: ${project.tasks.length}`,
    `Overview: ${project.overview || "-"}`,
    "",
    "# Tasks in current view",
  ];

  if (filteredTasks.length === 0) {
    lines.push("- None");
  } else {
    filteredTasks.forEach((task, index) => {
      lines.push(`${index + 1}. ${task.title}`);
      lines.push(`   Status: ${taskStatusLabels[task.status]}`);
      lines.push(`   Priority: ${formatLabel(task.priority)}`);
      lines.push(`   Type: ${taskTypeLabels[task.taskType]}`);
      if (task.assignee) lines.push(`   Assignee: ${task.assignee}`);
      if (task.dueDate) lines.push(`   Due: ${formatFullDate(task.dueDate)}`);
      if (task.description) lines.push(`   Details: ${task.description}`);
      if (task.blocker) lines.push(`   Blocker: ${task.blocker}`);
      if (task.nextAction) lines.push(`   Next action: ${task.nextAction}`);
      lines.push("");
    });
  }

  lines.push("# Recent decisions");
  if (project.decisions.length === 0) {
    lines.push("- None");
  } else {
    project.decisions.slice(0, 5).forEach((decision, index) => {
      lines.push(`${index + 1}. ${decision.title} (${formatFullDate(decision.decidedAt)})`);
      lines.push(`   ${decision.decisionText}`);
    });
  }

  lines.push("", "# Recent revision summaries");
  if (revisionArtifacts.length === 0) {
    lines.push("- None");
  } else {
    revisionArtifacts.slice(0, 5).forEach((artifact, index) => {
      lines.push(`${index + 1}. ${artifact.title}`);
      lines.push(`   ${artifact.extractedSummary || artifact.sourceText || "No summary yet."}`);
    });
  }

  lines.push("", "# Recent weekly reports");
  if (weeklyReports.length === 0) {
    lines.push("- None");
  } else {
    weeklyReports.slice(0, 3).forEach((report, index) => {
      lines.push(`${index + 1}. ${report.title}`);
      lines.push(`   ${report.extractedSummary || "No summary yet."}`);
    });
  }

  lines.push(
    "",
    "Please answer in Thai and keep recommendations practical and specific.",
  );

  return lines.join("\n").trim();
}

function downloadTextFile(filename: string, contents: string) {
  const blob = new Blob([contents], { type: "text/markdown;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function readLegacyTodos(): TrackerLegacyTodoImport[] {
  const items: TrackerLegacyTodoImport[] = [];
  const dedupe = new Set<string>();

  const rawLegacy = window.localStorage.getItem(trackerStorageKeys.legacyTodos);
  if (rawLegacy) {
    try {
      const parsed = JSON.parse(rawLegacy) as TrackerLegacyTodoImport[];
      for (const item of parsed) {
        const key = `${item.projectSlug ?? ""}:${item.title}:${item.createdAt ?? ""}`;
        if (!dedupe.has(key)) {
          dedupe.add(key);
          items.push(item);
        }
      }
    } catch {
      // Ignore unreadable legacy data.
    }
  }

  const rawTracker = window.localStorage.getItem(trackerStorageKeys.legacyTracker);
  if (rawTracker) {
    try {
      const parsed = JSON.parse(rawTracker) as {
        projects?: Array<{
          portalSlug?: string;
          tasks?: Array<{
            title: string;
            notes?: string;
            status?: string;
            priority?: string;
            createdAt?: string;
            completedAt?: string;
          }>;
        }>;
      };

      for (const project of parsed.projects ?? []) {
        for (const task of project.tasks ?? []) {
          const item: TrackerLegacyTodoImport = {
            title: task.title,
            description: task.notes,
            status: task.status,
            priority: task.priority,
            projectSlug: project.portalSlug,
            createdAt: task.createdAt,
            completedAt: task.completedAt,
          };

          const key = `${item.projectSlug ?? ""}:${item.title}:${item.createdAt ?? ""}`;
          if (!dedupe.has(key)) {
            dedupe.add(key);
            items.push(item);
          }
        }
      }
    } catch {
      // Ignore unreadable legacy tracker payloads.
    }
  }

  return items;
}

export function TodoListView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [workspace, setWorkspace] = useState<TrackerWorkspaceData | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [savedView, setSavedView] = useState<TrackerSavedView>("today");
  const [domainTab, setDomainTab] = useState<TrackerDomainTab>("tasks");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [taskDraft, setTaskDraft] = useState<TaskDraft | null>(null);
  const [editingTask, setEditingTask] = useState<TrackerTaskRecord | null>(null);
  const [projectDraft, setProjectDraft] = useState<ProjectDraft>(createEmptyProjectDraft);
  const [meetingDraft, setMeetingDraft] = useState<MeetingDraft>(createEmptyMeetingDraft);
  const [logDraft, setLogDraft] = useState<LogDraft>(createEmptyLogDraft);
  const [uploadDraft, setUploadDraft] = useState<UploadDraft>(createEmptyUploadDraft);
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [isLeftRailCollapsed, setIsLeftRailCollapsed] = useState(false);
  const [hasHandledLaunchTarget, setHasHandledLaunchTarget] = useState(false);

  useEffect(() => {
    void loadWorkspace();
  }, []);

  useEffect(() => {
    if (!workspace || activeProjectId) return;
    setActiveProjectId(workspace.projects[0]?.id ?? null);
  }, [workspace, activeProjectId]);

  useEffect(() => {
    if (!workspace || hasHandledLaunchTarget) return;

    const projectId = searchParams.get("project");
    const taskId = searchParams.get("task");
    if (!projectId && !taskId) return;

    const project =
      workspace.projects.find((entry) => entry.id === projectId) ??
      workspace.projects.find((entry) => entry.tasks.some((task) => task.id === taskId)) ??
      null;

    if (project) {
      setActiveProjectId(project.id);
      setDomainTab("tasks");

      const task = taskId ? project.tasks.find((entry) => entry.id === taskId) ?? null : null;
      if (task) {
        setEditingTask(task);
      }
    }

    setHasHandledLaunchTarget(true);
    router.replace("/todos", { scroll: false });
  }, [hasHandledLaunchTarget, router, searchParams, workspace]);

  const activeProject = useMemo(() => {
    if (!workspace) return null;
    if (!activeProjectId) return workspace.projects[0] ?? null;
    return (
      workspace.projects.find((project) => project.id === activeProjectId) ??
      workspace.projects[0] ??
      null
=======
=======
>>>>>>> theirs
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
<<<<<<< ours

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

=======

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

>>>>>>> theirs
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
<<<<<<< ours

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

=======

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

>>>>>>> theirs
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
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
    );
  }, [workspace, activeProjectId]);

  const pendingReviewCount = useMemo(
    () => workspace?.reviewItems.filter((item) => item.status === "pending").length ?? 0,
    [workspace],
  );

  const savedViewCounts = useMemo(() => {
    const tasks = activeProject?.tasks ?? [];
    const artifacts = activeProject?.artifacts ?? [];

    return {
      today: filterTasksForSavedView(tasks, "today").length,
      this_week: filterTasksForSavedView(tasks, "this_week").length,
      waiting_on: filterTasksForSavedView(tasks, "waiting_on").length,
      overdue: filterTasksForSavedView(tasks, "overdue").length,
      rfis: filterTasksForSavedView(tasks, "rfis").length,
      submittals: filterTasksForSavedView(tasks, "submittals").length,
      site_issues: filterTasksForSavedView(tasks, "site_issues").length,
      revision_log: artifacts.filter((artifact) => artifact.kind === "drawing_revision").length,
      punch_list: filterTasksForSavedView(tasks, "punch_list").length,
      weekly_report: artifacts.filter((artifact) => artifact.kind === "weekly_report").length,
    } satisfies Record<TrackerSavedView, number>;
  }, [activeProject]);

  const filteredTasks = useMemo(
    () => filterTasksForSavedView(activeProject?.tasks ?? [], savedView),
    [activeProject, savedView],
  );

  async function loadWorkspace() {
    setLoading(true);
    try {
      const data = await requestJson<{ workspace: TrackerWorkspaceData }>(
        "/api/tracker/workspace",
      );
      startTransition(() => {
        setWorkspace(data.workspace);
      });
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Failed to load tracker workspace",
      );
    } finally {
      setLoading(false);
    }
  }

<<<<<<< ours
  async function withWorkspaceMutation(
    action: () => Promise<{ workspace?: TrackerWorkspaceData }>,
    successMessage?: string,
  ) {
    setWorking(true);
    try {
      const data = await action();
      if (data.workspace) {
        startTransition(() => {
          setWorkspace(data.workspace ?? null);
        });
      } else {
        await loadWorkspace();
      }
      if (successMessage) {
        setStatusMessage(successMessage);
      }
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Tracker request failed",
      );
    } finally {
      setWorking(false);
    }
  }

<<<<<<< ours
  function handleSavedViewChange(view: TrackerSavedView) {
    setSavedView(view);
    if (view === "revision_log") setDomainTab("revision_log");
    else if (view === "weekly_report") setDomainTab("weekly_report");
    else setDomainTab("tasks");
  }

  async function handleCopyAiBrief() {
    if (!activeProject) return;

    const project = activeProject;
    const brief = buildAiChatBrief({
      project,
      filteredTasks,
      revisionArtifacts,
      weeklyReports,
      savedView,
      domainTab,
    });

    try {
      await navigator.clipboard.writeText(brief);
      setStatusMessage("Copied project brief for AI chat.");
    } catch {
      downloadTextFile(`${project.slug}-ai-brief.md`, brief);
      setStatusMessage("Clipboard blocked, downloaded an AI brief instead.");
    }
  }

  async function handleLegacyImport() {
    const items = readLegacyTodos();

    if (items.length === 0) {
      setStatusMessage("No legacy browser data found to import.");
      return;
    }

    setWorking(true);
    try {
      const data = await requestJson<{ workspace: TrackerWorkspaceData }>(
        "/api/tracker/import/legacy",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        },
      );
      startTransition(() => {
        setWorkspace(data.workspace);
      });
      setStatusMessage(`Imported ${items.length} legacy todo item(s).`);
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Legacy import failed",
      );
    } finally {
      setWorking(false);
    }
  }

  async function handleDeleteProject(project: TrackerProjectDetail) {
    const confirmed = window.confirm(
      `Delete "${project.name}" and all of its tasks, decisions, review items, and uploads? This cannot be undone.`,
    );

    if (!confirmed) return;

    setWorking(true);
    try {
      const data = await requestJson<{ deleted: boolean; workspace: TrackerWorkspaceData }>(
        `/api/tracker/projects/${project.id}`,
        {
          method: "DELETE",
        },
      );

      startTransition(() => {
        setWorkspace(data.workspace);
        setActiveProjectId(data.workspace.projects[0]?.id ?? null);
      });
      setDialog(null);
      setStatusMessage(`Deleted project "${project.name}".`);
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Failed to delete project",
      );
    } finally {
      setWorking(false);
    }
=======
  function addTask(task: Omit<TrackerTask, "id">) {
    updateProjects((prev) =>
      prev.map((project) =>
        project.id === activeProjectId ? { ...project, tasks: [{ ...task, id: generateId() }, ...project.tasks] } : project,
      ),
    );
  }

=======
  function addTask(task: Omit<TrackerTask, "id">) {
    updateProjects((prev) =>
      prev.map((project) =>
        project.id === activeProjectId ? { ...project, tasks: [{ ...task, id: generateId() }, ...project.tasks] } : project,
      ),
    );
  }

>>>>>>> theirs
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
<<<<<<< ours
=======
  }

  function cycleStatus(taskId: string) {
    if (!activeProject) return;
    const order: TrackerTaskStatus[] = ["todo", "progress", "review", "done"];
    const current = activeProject.tasks.find((task) => task.id === taskId);
    if (!current) return;
    const next = order[(order.indexOf(current.status) + 1) % order.length];
    updateTask(taskId, { status: next });
>>>>>>> theirs
  }

  function cycleStatus(taskId: string) {
    if (!activeProject) return;
    const order: TrackerTaskStatus[] = ["todo", "progress", "review", "done"];
    const current = activeProject.tasks.find((task) => task.id === taskId);
    if (!current) return;
    const next = order[(order.indexOf(current.status) + 1) % order.length];
    updateTask(taskId, { status: next });
>>>>>>> theirs
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="caption-editorial">Tracker</p>
          <h1 className="mt-2 font-display text-4xl font-medium">Loading workspace…</h1>
        </div>
      </div>
    );
  }

  if (!workspace || !activeProject) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="max-w-xl text-center">
          <p className="caption-editorial">Tracker</p>
          <h1 className="mt-2 font-display text-4xl font-medium">No project workspace</h1>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Workspace นี้ว่างอยู่จริงแล้ว สามารถเริ่มจากการสร้างโปรเจกต์แรก
            หรือค่อย import ข้อมูล legacy จาก browser เครื่องนี้ด้วยตัวเองภายหลัง
          </p>
          {statusMessage ? (
            <div className="mt-4 rounded-[1.25rem] border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
              {statusMessage}
            </div>
          ) : null}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setProjectDraft(createEmptyProjectDraft());
                setDialog("project");
              }}
              className="inline-flex h-11 items-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
            >
              Create first project
            </button>
            <button
              type="button"
              onClick={() => {
                void handleLegacyImport();
              }}
              disabled={working}
              className="inline-flex h-11 items-center rounded-full border border-border px-5 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              Import legacy local data
            </button>
            <Link
              href="/todos/guide"
              className="inline-flex h-11 items-center rounded-full border border-border px-5 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
            >
              Open Kanban guide
            </Link>
          </div>
        </div>
        {dialog === "project" ? (
          <DialogFrame title="Create project" onClose={() => setDialog(null)}>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void withWorkspaceMutation(
                  () =>
                    requestJson<{ workspace: TrackerWorkspaceData }>("/api/tracker/projects", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(projectDraft),
                    }),
                  "Project created.",
                );
                setDialog(null);
              }}
            >
              <ProjectFormFields draft={projectDraft} onChange={setProjectDraft} />
              <DialogActions onCancel={() => setDialog(null)} working={working} />
            </form>
          </DialogFrame>
        ) : null}
      </div>
    );
  }

  const revisionArtifacts = activeProject.artifacts.filter(
    (artifact) => artifact.kind === "drawing_revision",
  );
  const weeklyReports = activeProject.artifacts.filter(
    (artifact) => artifact.kind === "weekly_report",
  );
  const projectReviewItems = workspace.reviewItems.filter(
    (item) => item.projectId === activeProject.id,
  );
  const layoutClassName = isLeftRailCollapsed
    ? "lg:grid-cols-[minmax(0,1fr)]"
    : "lg:grid-cols-[290px_minmax(0,1fr)]";

  return (
    <div className="min-h-screen bg-background">
<<<<<<< ours
<<<<<<< ours
      <div
        className={cn(
          "mx-auto grid min-h-screen max-w-[1680px] transition-[grid-template-columns] duration-300",
          layoutClassName,
        )}
      >
        {!isLeftRailCollapsed ? (
          <div className="min-h-0">
            <ProjectRail
              projects={workspace.projects}
              activeProjectId={activeProject.id}
              pendingReviewCount={pendingReviewCount}
              onSelect={setActiveProjectId}
              onCreateProject={() => {
                setProjectDraft(createEmptyProjectDraft());
                setDialog("project");
              }}
            />
          </div>
        ) : null}

        <main className="flex min-w-0 flex-col bg-[linear-gradient(180deg,#fff_0%,#fbf9f6_100%)] px-5 py-6 lg:px-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <SidebarToggleButton
                collapsed={isLeftRailCollapsed}
                side="left"
                hideLabel="Hide projects"
                showLabel="Show projects"
                onClick={() => setIsLeftRailCollapsed((prev) => !prev)}
              />
              <Link
                href="/todos/guide"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
              >
                <BookOpenText className="size-4" />
                Kanban Guide
              </Link>
            </div>
            <button
              type="button"
              onClick={() => {
                void handleCopyAiBrief();
              }}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
            >
              <Copy className="size-4" />
              Copy for AI chat
            </button>
          </div>

          <WorkspaceHeader
            isWorking={working}
            project={activeProject}
            onPhaseChange={(phase) => {
              void withWorkspaceMutation(
                () =>
                  requestJson<{ workspace: TrackerWorkspaceData }>(
                    `/api/tracker/projects/${activeProject.id}`,
                    {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ phase }),
                    },
                  ),
                "Project phase updated.",
              );
            }}
            onStatusChange={(status) => {
              void withWorkspaceMutation(
                () =>
                  requestJson<{ workspace: TrackerWorkspaceData }>(
                    `/api/tracker/projects/${activeProject.id}`,
                    {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ status }),
                    },
                  ),
                "Project status updated.",
              );
            }}
            onDeleteProject={() => {
              void handleDeleteProject(activeProject);
            }}
            onNewTask={() => {
              setTaskDraft(createEmptyTaskDraft(activeProject.phase));
              setDialog("task");
            }}
            onOpenIntake={() => setDialog("meeting")}
          />

          <div className="mt-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <SavedViewBar
              activeView={savedView}
              counts={savedViewCounts}
              onChange={handleSavedViewChange}
            />
            <DomainTabs activeTab={domainTab} onChange={setDomainTab} />
          </div>

          {statusMessage ? (
            <div className="mt-4 rounded-[1.5rem] border border-border bg-background px-5 py-3 text-sm text-muted-foreground">
              {statusMessage}
            </div>
          ) : null}

          <div className="mt-6 flex-1 space-y-6 pb-10">
            {domainTab === "tasks" ? (
              <TaskBoard
                tasks={filteredTasks}
                onCreateTask={() => {
                  setTaskDraft(createEmptyTaskDraft(activeProject.phase));
                  setDialog("task");
                }}
                onEditTask={(task) => setEditingTask(task)}
                onReorder={async (items) => {
                  await withWorkspaceMutation(
                    () =>
                      requestJson<{ workspace: TrackerWorkspaceData }>(
                        "/api/tracker/tasks/reorder",
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            projectId: activeProject.id,
                            tasks: items,
                          }),
                        },
                      ),
                  );
                }}
              />
            ) : null}

            {domainTab === "decisions" ? (
              <section className="space-y-4">
                <div>
                  <p className="caption-editorial text-[0.7rem]">Decision Log</p>
                  <h3 className="mt-1 font-display text-3xl font-medium tracking-tight">
                    Approved decisions
                  </h3>
                </div>
                <div className="space-y-3">
                  {activeProject.decisions.map((decision) => (
                    <article
                      key={decision.id}
                      className="rounded-[1.5rem] border border-border bg-background p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h4 className="text-base font-medium">{decision.title}</h4>
                        <span className="text-sm text-muted-foreground">
                          {formatFullDate(decision.decidedAt)}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-muted-foreground">
                        {decision.decisionText}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {domainTab === "revision_log" ? (
              <ArtifactPanel
                title="Revision log"
                subtitle="Drawing revisions and approved summaries"
                artifacts={revisionArtifacts}
              />
            ) : null}

            {domainTab === "weekly_report" ? (
              <WeeklyReportPanel
                reports={weeklyReports}
                onGenerate={async () => {
                  await withWorkspaceMutation(
                    () =>
                      requestJson<{ workspace: TrackerWorkspaceData }>(
                        "/api/tracker/weekly-report",
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ projectId: activeProject.id }),
                        },
                      ),
                    "Weekly report proposal queued for review.",
                  );
                }}
              />
            ) : null}

            {domainTab === "review_queue" ? (
              <ReviewQueue
                items={projectReviewItems}
                onApprove={async (reviewItemId) => {
                  await withWorkspaceMutation(
                    () =>
                      requestJson<{ workspace: TrackerWorkspaceData }>(
                        `/api/tracker/review/${reviewItemId}/approve`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ reviewedBy: "BNJ Studio" }),
                        },
                      ),
                    "Review item approved.",
                  );
                }}
                onReject={async (reviewItemId, reason) => {
                  await withWorkspaceMutation(
                    () =>
                      requestJson<{ workspace: TrackerWorkspaceData }>(
                        `/api/tracker/review/${reviewItemId}/reject`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ reviewedBy: "BNJ Studio", reason }),
                        },
                      ),
                    "Review item rejected.",
                  );
                }}
              />
            ) : null}
          </div>
        </main>
      </div>

      {dialog === "task" && taskDraft ? (
        <DialogFrame title="Add task" onClose={() => setDialog(null)}>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void withWorkspaceMutation(
                () =>
                  requestJson<{ workspace: TrackerWorkspaceData }>("/api/tracker/tasks", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      projectId: activeProject.id,
                      task: taskDraft,
                    }),
                  }),
                "Task created.",
              );
              setDialog(null);
            }}
          >
            <TaskFormFields draft={taskDraft} onChange={setTaskDraft} />
            <DialogActions onCancel={() => setDialog(null)} working={working} />
          </form>
        </DialogFrame>
      ) : null}

      {editingTask ? (
        <DialogFrame title="Edit task" onClose={() => setEditingTask(null)}>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void withWorkspaceMutation(
                () =>
                  requestJson<{ workspace: TrackerWorkspaceData }>(
                    `/api/tracker/tasks/${editingTask.id}`,
                    {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(editingTask),
                    },
                  ),
                "Task updated.",
              );
              setEditingTask(null);
            }}
          >
            <TaskFormFields
              draft={editingTask}
              onChange={(draft) =>
                setEditingTask((prev) => (prev ? { ...prev, ...draft } : prev))
              }
            />
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  void withWorkspaceMutation(
                    () =>
                      requestJson<{ workspace: TrackerWorkspaceData }>(
                        `/api/tracker/tasks/${editingTask.id}`,
                        {
                          method: "DELETE",
                        },
                      ),
                    "Task deleted.",
                  );
                  setEditingTask(null);
                }}
                className="rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
              >
                Delete
              </button>
              <DialogActions onCancel={() => setEditingTask(null)} working={working} />
            </div>
          </form>
        </DialogFrame>
      ) : null}

      {dialog === "project" ? (
        <DialogFrame title="Create project" onClose={() => setDialog(null)}>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void withWorkspaceMutation(
                () =>
                  requestJson<{ workspace: TrackerWorkspaceData }>("/api/tracker/projects", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(projectDraft),
                  }),
                "Project created.",
              );
              setDialog(null);
            }}
          >
            <ProjectFormFields draft={projectDraft} onChange={setProjectDraft} />
            <DialogActions onCancel={() => setDialog(null)} working={working} />
          </form>
        </DialogFrame>
      ) : null}

      {dialog === "meeting" ? (
        <DialogFrame title="Meeting note intake" onClose={() => setDialog(null)}>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void withWorkspaceMutation(
                () =>
                  requestJson<{ workspace: TrackerWorkspaceData }>(
                    "/api/tracker/intake/meeting-notes",
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        projectId: activeProject.id,
                        ...meetingDraft,
                      }),
                    },
                  ),
                "Meeting note queued for review.",
              );
              setMeetingDraft(createEmptyMeetingDraft());
              setDialog(null);
            }}
          >
            <input
              value={meetingDraft.title}
              onChange={(event) =>
                setMeetingDraft((prev) => ({ ...prev, title: event.target.value }))
              }
              placeholder="Meeting title"
              className="h-11 w-full rounded-full border border-border px-4 text-sm outline-none transition-colors focus:border-foreground"
            />
            <textarea
              value={meetingDraft.content}
              onChange={(event) =>
                setMeetingDraft((prev) => ({ ...prev, content: event.target.value }))
              }
              placeholder="Paste minutes, discussion notes, or action items..."
              rows={8}
              className="w-full rounded-[1.25rem] border border-border px-4 py-3 text-sm outline-none transition-colors focus:border-foreground"
            />
            <div className="flex justify-between gap-3">
              <button
                type="button"
                onClick={() => setDialog("log")}
                className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
              >
                Switch to log intake
              </button>
              <DialogActions onCancel={() => setDialog(null)} working={working} />
            </div>
          </form>
        </DialogFrame>
      ) : null}

      {dialog === "log" ? (
        <DialogFrame title="RFI / revision intake" onClose={() => setDialog(null)}>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void withWorkspaceMutation(
                () =>
                  requestJson<{ workspace: TrackerWorkspaceData }>(
                    "/api/tracker/intake/logs",
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        projectId: activeProject.id,
                        ...logDraft,
                      }),
                    },
                  ),
                "Log intake queued for review.",
              );
              setLogDraft(createEmptyLogDraft());
              setDialog(null);
            }}
          >
            <input
              value={logDraft.title}
              onChange={(event) =>
                setLogDraft((prev) => ({ ...prev, title: event.target.value }))
              }
              placeholder="Log title"
              className="h-11 w-full rounded-full border border-border px-4 text-sm outline-none transition-colors focus:border-foreground"
            />
            <select
              value={logDraft.kind}
              onChange={(event) =>
                setLogDraft((prev) => ({
                  ...prev,
                  kind: event.target.value as LogDraft["kind"],
                }))
              }
              className="h-11 w-full rounded-full border border-border px-4 text-sm outline-none transition-colors focus:border-foreground"
            >
              <option value="drawing_revision">Drawing Revision</option>
              <option value="rfi_log">RFI Log</option>
              <option value="submittal_log">Submittal Log</option>
            </select>
            <textarea
              value={logDraft.content}
              onChange={(event) =>
                setLogDraft((prev) => ({ ...prev, content: event.target.value }))
              }
              placeholder="Paste CSV rows, revision notes, or extracted text..."
              rows={8}
              className="w-full rounded-[1.25rem] border border-border px-4 py-3 text-sm outline-none transition-colors focus:border-foreground"
            />
            <div className="flex justify-between gap-3">
              <button
                type="button"
                onClick={() => setDialog("upload")}
                className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
              >
                Switch to image intake
              </button>
              <DialogActions onCancel={() => setDialog(null)} working={working} />
            </div>
          </form>
        </DialogFrame>
      ) : null}

      {dialog === "upload" ? (
        <DialogFrame title="Site photo / markup intake" onClose={() => setDialog(null)}>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData();
              formData.set("projectId", activeProject.id);
              formData.set("title", uploadDraft.title);
              formData.set("kind", uploadDraft.kind);
              formData.set("notes", uploadDraft.notes);
              if (uploadDraft.file) {
                formData.set("file", uploadDraft.file);
              }

              void withWorkspaceMutation(
                () =>
                  requestJson<{ workspace: TrackerWorkspaceData }>(
                    "/api/tracker/intake/uploads",
                    {
                      method: "POST",
                      body: formData,
                    },
                  ),
                "Image intake queued for review.",
              );
              setUploadDraft(createEmptyUploadDraft());
              setDialog(null);
            }}
          >
            <input
              value={uploadDraft.title}
              onChange={(event) =>
                setUploadDraft((prev) => ({ ...prev, title: event.target.value }))
              }
              placeholder="Artifact title"
              className="h-11 w-full rounded-full border border-border px-4 text-sm outline-none transition-colors focus:border-foreground"
            />
            <select
              value={uploadDraft.kind}
              onChange={(event) =>
                setUploadDraft((prev) => ({
                  ...prev,
                  kind: event.target.value as UploadDraft["kind"],
                }))
              }
              className="h-11 w-full rounded-full border border-border px-4 text-sm outline-none transition-colors focus:border-foreground"
            >
              <option value="site_photo">Site Photo</option>
              <option value="site_markup">Site Markup</option>
            </select>
            <input
              type="file"
              accept="image/*"
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setUploadDraft((prev) => ({
                  ...prev,
                  file: event.target.files?.[0] ?? null,
                }))
              }
              className="h-11 w-full rounded-full border border-border px-4 py-2 text-sm outline-none transition-colors focus:border-foreground"
            />
            <textarea
              value={uploadDraft.notes}
              onChange={(event) =>
                setUploadDraft((prev) => ({ ...prev, notes: event.target.value }))
              }
              placeholder="Optional site notes"
              rows={6}
              className="w-full rounded-[1.25rem] border border-border px-4 py-3 text-sm outline-none transition-colors focus:border-foreground"
            />
            <DialogActions onCancel={() => setDialog(null)} working={working} />
          </form>
        </DialogFrame>
      ) : null}
    </div>
  );
}

function SidebarToggleButton({
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
        "inline-flex h-10 items-center gap-2 rounded-full border bg-background px-4 text-sm font-medium transition-colors",
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

function ArtifactPanel({
  title,
  subtitle,
  artifacts,
}: {
  title: string;
  subtitle: string;
  artifacts: TrackerArtifactRecord[];
}) {
  return (
    <section className="space-y-4">
      <div>
        <p className="caption-editorial text-[0.7rem]">{title}</p>
        <h3 className="mt-1 font-display text-3xl font-medium tracking-tight">
          {subtitle}
        </h3>
      </div>
      <div className="space-y-3">
        {artifacts.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-border bg-background px-5 py-10 text-center text-muted-foreground">
            No artifacts for {title.toLowerCase()}.
          </div>
        ) : null}
        {artifacts.map((artifact) => (
          <article
            key={artifact.id}
            className="rounded-[1.5rem] border border-border bg-background p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-base font-medium">{artifact.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatFullDate(artifact.createdAt)}
                </p>
              </div>
              {artifact.revision ? (
                <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                  {artifact.revision}
                </span>
              ) : null}
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
              {artifact.extractedSummary || artifact.sourceText || "No summary yet."}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function DialogFrame({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-background p-6 shadow-[0_24px_80px_rgba(0,0,0,0.2)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="caption-editorial text-[0.7rem]">Tracker</p>
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

function DialogActions({
  onCancel,
  working,
}: {
  onCancel: () => void;
  working: boolean;
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
        {working ? "Working..." : "Save"}
      </button>
    </div>
  );
}

function TaskFormFields({
  draft,
  onChange,
}: {
  draft: TrackerTaskMutationInput;
  onChange: (draft: TrackerTaskMutationInput) => void;
}) {
  return (
    <>
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
      <div className="grid gap-4 md:grid-cols-2">
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
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
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
=======
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
>>>>>>> theirs
      </div>
    </>
  );
}

<<<<<<< ours
function ProjectFormFields({
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
=======
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

=======
>>>>>>> theirs
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
<<<<<<< ours
=======
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
>>>>>>> theirs
            </div>
          </div>
        </ModalShell>
      ) : null}

<<<<<<< ours
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

=======
>>>>>>> theirs
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
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
  );
}
