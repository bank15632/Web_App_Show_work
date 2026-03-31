"use client";

import {
  startTransition,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpenText,
  ChevronLeft,
  ChevronRight,
  Copy,
  ListChecks,
  Undo2,
} from "lucide-react";

import { DomainTabs } from "@/components/portal/tracker/domain-tabs";
import { HoverHelp } from "@/components/portal/tracker/hover-help";
import { ProjectRail } from "@/components/portal/tracker/project-rail";
import { TaskBoard } from "@/components/portal/tracker/task-board";
import { WorkspaceHeader } from "@/components/portal/tracker/workspace-header";
import {
  priorityDescriptions,
  priorityLabels,
  taskStatusDescriptions,
  taskStatusLabels,
  taskTypeDescriptions,
  taskTypeLabels,
  trackerStorageKeys,
} from "@/lib/tracker/constants";
import type {
  TrackerDecisionMutationInput,
  TrackerDecisionRecord,
  TrackerDomainTab,
  TrackerLegacyTodoImport,
  TrackerProjectDetail,
  TrackerProjectMutationInput,
  TrackerTaskMutationInput,
  TrackerTaskRecord,
  TrackerWorkspaceData,
} from "@/lib/tracker/types";
import { createGtdItemRequest } from "@/lib/gtd/client";
import { cn } from "@/lib/utils";

type DialogState = null | "task" | "decision" | "project";

type TaskDraft = TrackerTaskMutationInput;
type DecisionDraft = TrackerDecisionMutationInput;
type ProjectDraft = TrackerProjectMutationInput;

async function requestJson<T>(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, init);
  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
  } & T;

  if (!response.ok) {
    throw new Error(data.error || "Kanban board request failed");
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
    subtasks: [],
  };
}

function createEmptyDecisionDraft(): DecisionDraft {
  return {
    title: "",
    decisionText: "",
    decidedBy: "BNJ Studio",
    decidedAt: new Date().toISOString().slice(0, 10),
    sourceArtifactId: null,
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

function toDecisionDraft(decision: TrackerDecisionRecord): DecisionDraft {
  return {
    title: decision.title,
    decisionText: decision.decisionText,
    decidedBy: decision.decidedBy,
    decidedAt: decision.decidedAt,
    sourceArtifactId: decision.sourceArtifactId,
  };
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
  visibleTasks,
  domainTab,
}: {
  project: TrackerProjectDetail;
  visibleTasks: TrackerTaskRecord[];
  domainTab: TrackerDomainTab;
}) {
  const openTasks = project.tasks.filter((task) => task.status !== "done");
  const lines = [
    "You are helping me review an architecture Kanban board.",
    "Use only the approved project data below. If something is missing, say so clearly.",
    "",
    "# Project snapshot",
    `Project: ${project.name} (${project.code || project.slug})`,
    `Phase: ${formatLabel(project.phase)}`,
    `Status: ${formatLabel(project.status)}`,
    `Client: ${project.clientName || "BNJ Studio"}`,
    `Location: ${project.location || "Bangkok"}`,
    `Current section: ${formatLabel(domainTab)}`,
    `Open tasks: ${openTasks.length}`,
    `Total tasks: ${project.tasks.length}`,
    `Overview: ${project.overview || "-"}`,
    "",
    "# Tasks in current view",
  ];

  if (visibleTasks.length === 0) {
    lines.push("- None");
  } else {
    visibleTasks.forEach((task, index) => {
      lines.push(`${index + 1}. ${task.title}`);
      lines.push(`   Status: ${taskStatusLabels[task.status]}`);
      lines.push(`   Priority: ${formatLabel(task.priority)}`);
      lines.push(`   Type: ${taskTypeLabels[task.taskType]}`);
      if (task.assignee) lines.push(`   Assignee: ${task.assignee}`);
      if (task.dueDate) lines.push(`   Due: ${formatFullDate(task.dueDate)}`);
      if (task.description) lines.push(`   Details: ${task.description}`);
      if (task.blocker) lines.push(`   Blocker: ${task.blocker}`);
      if (task.nextAction) lines.push(`   Next action: ${task.nextAction}`);
      if (task.subtasks.length > 0) {
        lines.push(
          `   Sub-tasks: ${task.subtasks
            .map((subtask) => `${subtask.completed ? "[x]" : "[ ]"} ${subtask.title}`)
            .join(", ")}`,
        );
      }
      lines.push("");
    });
  }

  lines.push("# Approved decisions");
  if (project.decisions.length === 0) {
    lines.push("- None");
  } else {
    project.decisions.slice(0, 6).forEach((decision, index) => {
      lines.push(`${index + 1}. ${decision.title} (${formatFullDate(decision.decidedAt)})`);
      lines.push(`   Owner: ${decision.decidedBy || "BNJ Studio"}`);
      lines.push(`   ${decision.decisionText}`);
    });
  }

  lines.push(
    "",
    "Please answer in Thai and keep recommendations practical, short, and specific.",
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

function getEditableSubtasks(
  subtasks: TrackerTaskMutationInput["subtasks"] | TrackerTaskRecord["subtasks"],
) {
  const rows = [...(subtasks ?? [])].map((subtask) => ({
    title: subtask.title,
    completed: subtask.completed === true,
  }));

  return rows.length > 0 ? rows : [{ title: "", completed: false }];
}

function sanitizeTaskDraft(draft: TrackerTaskMutationInput): TrackerTaskMutationInput {
  return {
    ...draft,
    subtasks: (draft.subtasks ?? []).filter((subtask) => subtask.title.trim().length > 0),
  };
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
  const [domainTab, setDomainTab] = useState<TrackerDomainTab>("tasks");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [taskDraft, setTaskDraft] = useState<TaskDraft | null>(null);
  const [editingTask, setEditingTask] = useState<TrackerTaskRecord | null>(null);
  const [decisionDraft, setDecisionDraft] = useState<DecisionDraft>(createEmptyDecisionDraft);
  const [editingDecision, setEditingDecision] = useState<TrackerDecisionRecord | null>(null);
  const [projectDraft, setProjectDraft] = useState<ProjectDraft>(createEmptyProjectDraft);
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const workingRef = useRef(false);
  const [isLeftRailCollapsed, setIsLeftRailCollapsed] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches,
  );
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
    );
  }, [workspace, activeProjectId]);

  const visibleTasks = activeProject?.tasks ?? [];

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
        error instanceof Error ? error.message : "Failed to load Kanban board",
      );
    } finally {
      setLoading(false);
    }
  }

  async function withWorkspaceMutation<T extends { workspace?: TrackerWorkspaceData }>(
    action: () => Promise<T>,
    successMessage?: string,
    onSuccess?: (data: T) => void,
  ) {
    if (workingRef.current) {
      return false;
    }

    workingRef.current = true;
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
      onSuccess?.(data);
      if (successMessage) {
        setStatusMessage(successMessage);
      }
      return true;
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Kanban board request failed",
      );
      return false;
    } finally {
      workingRef.current = false;
      setWorking(false);
    }
  }

  async function handleCopyAiBrief() {
    if (!activeProject) return;

    const brief = buildAiChatBrief({
      project: activeProject,
      visibleTasks,
      domainTab,
    });

    try {
      await navigator.clipboard.writeText(brief);
      setStatusMessage("Copied project brief for AI chat.");
    } catch {
      downloadTextFile(`${activeProject.slug}-ai-brief.md`, brief);
      setStatusMessage("Clipboard blocked, downloaded an AI brief instead.");
    }
  }

  async function handleLegacyImport() {
    const items = readLegacyTodos();

    if (items.length === 0) {
      setStatusMessage("No legacy browser data found to import.");
      return;
    }

    await withWorkspaceMutation(
      () =>
        requestJson<{ workspace: TrackerWorkspaceData }>("/api/tracker/import/legacy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        }),
      `Imported ${items.length} legacy todo item(s).`,
    );
  }

  async function handleDeleteProject(project: TrackerProjectDetail) {
    const confirmed = window.confirm(
      `Delete "${project.name}" and all of its tasks, decisions, and project data? This cannot be undone.`,
    );

    if (!confirmed) return;

    await withWorkspaceMutation(
      () =>
        requestJson<{ deleted: boolean; workspace: TrackerWorkspaceData }>(
          `/api/tracker/projects/${project.id}`,
          {
            method: "DELETE",
          },
        ),
      `Deleted project "${project.name}".`,
      (data) => {
        setDialog(null);
        setEditingTask(null);
        setEditingDecision(null);
        setActiveProjectId(data.workspace?.projects[0]?.id ?? null);
      },
    );
  }

  async function handleChecklistToggle(itemId: string, completed: boolean) {
    if (!activeProject) return;

    await withWorkspaceMutation(() =>
      requestJson<{ workspace: TrackerWorkspaceData }>(
        `/api/tracker/projects/${activeProject.id}/checklist`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId, completed }),
        },
      ),
    );
  }

  async function handleChecklistCreate(
    sectionKey: string,
    label: string,
    description: string,
  ) {
    if (!activeProject) return;

    await withWorkspaceMutation(
      () =>
        requestJson<{ workspace: TrackerWorkspaceData }>(
          `/api/tracker/projects/${activeProject.id}/checklist`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sectionKey, label, description }),
          },
        ),
      "Added checklist item to this project.",
    );
  }

  async function handleChecklistRemove(itemId: string) {
    if (!activeProject) return;

    await withWorkspaceMutation(
      () =>
        requestJson<{ workspace: TrackerWorkspaceData }>(
          `/api/tracker/projects/${activeProject.id}/checklist`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ itemId }),
          },
        ),
      "Removed checklist item from this project.",
    );
  }

  async function handleChecklistRestore(itemKey: string) {
    if (!activeProject) return;

    await withWorkspaceMutation(
      () =>
        requestJson<{ workspace: TrackerWorkspaceData }>(
          `/api/tracker/projects/${activeProject.id}/checklist`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ itemKey }),
          },
        ),
      "Restored hidden checklist item.",
    );
  }

  async function handleSaveDecision() {
    if (!activeProject) return;

    const isEditing = editingDecision !== null;
    const didSave = await withWorkspaceMutation(
      () =>
        requestJson<{ workspace: TrackerWorkspaceData }>(
          isEditing
            ? `/api/tracker/projects/${activeProject.id}/decisions/${editingDecision.id}`
            : `/api/tracker/projects/${activeProject.id}/decisions`,
          {
            method: isEditing ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(decisionDraft),
          },
        ),
      isEditing ? "Decision updated." : "Decision saved.",
    );

    if (didSave) {
      setDecisionDraft(createEmptyDecisionDraft());
      setEditingDecision(null);
      setDialog(null);
    }
  }

  async function handleDeleteDecision() {
    if (!activeProject || !editingDecision) return;

    const confirmed = window.confirm(`Delete decision "${editingDecision.title}"?`);
    if (!confirmed) return;

    const didDelete = await withWorkspaceMutation(
      () =>
        requestJson<{ deleted: boolean; workspace: TrackerWorkspaceData }>(
          `/api/tracker/projects/${activeProject.id}/decisions/${editingDecision.id}`,
          {
            method: "DELETE",
          },
        ),
      "Decision deleted.",
    );

    if (didDelete) {
      setDecisionDraft(createEmptyDecisionDraft());
      setEditingDecision(null);
      setDialog(null);
    }
  }

  async function handleSendBackToGtd(task: TrackerTaskRecord) {
    const confirmed = window.confirm(
      `Send "${task.title}" back to GTD inbox and remove from Kanban?`,
    );
    if (!confirmed) return;

    try {
      await createGtdItemRequest({
        text: task.title,
        bucket: "inbox",
        context: "",
        priority: task.priority,
        dueDate: task.dueDate,
        note: task.description || task.nextAction || "",
      });
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Failed to create GTD item.",
      );
      return;
    }

    await withWorkspaceMutation(
      () =>
        requestJson<{ workspace: TrackerWorkspaceData }>(
          `/api/tracker/tasks/${task.id}`,
          { method: "DELETE" },
        ),
      `"${task.title}" sent back to GTD inbox.`,
      () => {
        setEditingTask(null);
      },
    );
  }

  function openCreateTask() {
    if (!activeProject) return;
    setTaskDraft(createEmptyTaskDraft(activeProject.phase));
    setDialog("task");
  }

  function openCreateDecision() {
    setEditingDecision(null);
    setDecisionDraft(createEmptyDecisionDraft());
    setDialog("decision");
  }

  function openEditDecision(decision: TrackerDecisionRecord) {
    setEditingDecision(decision);
    setDecisionDraft(toDecisionDraft(decision));
    setDialog("decision");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="caption-editorial">Kanban board</p>
          <h1 className="mt-2 font-display text-4xl font-medium">Loading workspace...</h1>
        </div>
      </div>
    );
  }

  if (!workspace || workspace.projects.length === 0 || !activeProject) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <WorkspaceMutationOverlay open={working} />
        <div className="max-w-xl text-center">
          <p className="caption-editorial">Kanban board</p>
          <h1 className="mt-2 font-display text-4xl font-medium">No project workspace</h1>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Start with the first project, or import legacy browser data from this machine if you
            want to bring older tasks into the board.
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
                  (data) => {
                    setDialog(null);
                    setActiveProjectId(data.workspace?.projects[0]?.id ?? null);
                  },
                );
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

  const layoutClassName = isLeftRailCollapsed
    ? "lg:grid-cols-[minmax(0,1fr)]"
    : "lg:grid-cols-[290px_minmax(0,1fr)]";

  return (
    <div className="min-h-screen bg-background">
      <WorkspaceMutationOverlay open={working} />
      <div
        className={cn(
          "grid min-h-screen transition-[grid-template-columns] duration-300",
          layoutClassName,
        )}
      >
        {!isLeftRailCollapsed ? (
          <div className="min-h-0">
            <ProjectRail
              projects={workspace.projects}
              activeProjectId={activeProject.id}
              onSelect={setActiveProjectId}
              onCreateProject={() => {
                setProjectDraft(createEmptyProjectDraft());
                setDialog("project");
              }}
            />
          </div>
        ) : null}

        <main className="flex min-w-0 flex-col bg-[linear-gradient(180deg,#fff_0%,#fbf9f6_100%)] px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <SidebarToggleButton
                collapsed={isLeftRailCollapsed}
                side="left"
                hideLabel="Hide projects"
                showLabel="Show projects"
                onClick={() => setIsLeftRailCollapsed((prev) => !prev)}
              />
              <Link
                href="/"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-background px-4 text-[13px] font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground sm:text-sm"
              >
                <ArrowLeft className="size-4" />
                Dashboard
              </Link>
              <Link
                href="/gtd"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-background px-4 text-[13px] font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground sm:text-sm"
              >
                <ListChecks className="size-4" />
                GTD
              </Link>
              <Link
                href="/todos/guide"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-background px-4 text-[13px] font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground sm:text-sm"
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
              className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-background px-4 text-[13px] font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground sm:text-sm"
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
            onNewTask={openCreateTask}
          />

          <div className="mt-6 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-end">
            <DomainTabs
              activeTab={domainTab}
              counts={{
                tasks: activeProject.tasks.length,
                decisions: activeProject.decisions.length,
              }}
              onChange={setDomainTab}
            />
          </div>

          {statusMessage ? (
            <div className="mt-4 rounded-[1.5rem] border border-border bg-background px-5 py-3 text-sm text-muted-foreground">
              {statusMessage}
            </div>
          ) : null}

          <div className="mt-6 flex-1 space-y-6 pb-10">
            {domainTab === "tasks" ? (
              <TaskBoard
                phase={activeProject.phase}
                tasks={visibleTasks}
                checklistItems={activeProject.checklistItems}
                hiddenChecklistItems={activeProject.hiddenChecklistItems}
                checklistBusy={working}
                onCreateTask={openCreateTask}
                onEditTask={(task) => setEditingTask(task)}
                onToggleChecklist={(itemId, completed) => {
                  void handleChecklistToggle(itemId, completed);
                }}
                onAddChecklistItem={(sectionKey, label, description) =>
                  handleChecklistCreate(sectionKey, label, description)
                }
                onRemoveChecklistItem={(itemId) => handleChecklistRemove(itemId)}
                onRestoreHiddenChecklistItem={(itemKey) =>
                  handleChecklistRestore(itemKey)
                }
                onReorder={async (items) => {
                  await withWorkspaceMutation(() =>
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
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="caption-editorial text-[0.7rem]">Decision Log</p>
                    <div className="mt-1 flex items-center gap-2">
                      <h3 className="font-display text-3xl font-medium tracking-tight">
                        Approved decisions
                      </h3>
                      <HoverHelp
                        label="What belongs in approved decisions?"
                        buttonLabel="Show decisions help"
                        body="Store confirmed client approvals, design directions, scope decisions, and material calls here so the board always keeps the latest approved direction visible."
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={openCreateDecision}
                    className="inline-flex h-11 items-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
                  >
                    Add decision
                  </button>
                </div>

                {activeProject.decisions.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-dashed border-border bg-background px-5 py-10 text-center text-muted-foreground">
                    No approved decisions yet. Use <span className="font-medium text-foreground">Add decision</span> to keep final direction visible to the team.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeProject.decisions.map((decision) => (
                      <article
                        key={decision.id}
                        className="rounded-[1.5rem] border border-border bg-background p-5"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h4 className="text-base font-medium text-foreground">
                              {decision.title}
                            </h4>
                            <p className="mt-2 text-sm leading-7 text-muted-foreground">
                              {decision.decisionText}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                            <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                              {decision.decidedBy || "BNJ Studio"}
                            </span>
                            <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                              {formatFullDate(decision.decidedAt)}
                            </span>
                            <button
                              type="button"
                              onClick={() => openEditDecision(decision)}
                              className="inline-flex h-9 items-center rounded-full border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                              aria-label={`Edit decision ${decision.title}`}
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
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
                      task: sanitizeTaskDraft(taskDraft),
                    }),
                  }),
                "Task created.",
                () => {
                  setTaskDraft(null);
                  setDialog(null);
                },
              );
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
                      body: JSON.stringify(sanitizeTaskDraft(editingTask)),
                    },
                  ),
                "Task updated.",
                () => {
                  setEditingTask(null);
                },
              );
            }}
          >
            <TaskFormFields
              draft={editingTask}
              onChange={(draft) =>
                setEditingTask((prev) => {
                  if (!prev) {
                    return prev;
                  }

                  const nextSubtasks =
                    draft.subtasks?.map((subtask, index) => ({
                      id: prev.subtasks[index]?.id ?? `draft-subtask-${index}`,
                      title: subtask.title,
                      completed: subtask.completed === true,
                      sortOrder: index,
                    })) ?? prev.subtasks;

                  return {
                    ...prev,
                    ...draft,
                    subtasks: nextSubtasks,
                  };
                })
              }
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
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
                      () => {
                        setEditingTask(null);
                      },
                    );
                  }}
                  className="rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
                >
                  Delete
                </button>
                <button
                  type="button"
                  disabled={working}
                  onClick={() => {
                    void handleSendBackToGtd(editingTask);
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-60"
                >
                  <Undo2 className="size-3.5" />
                  Send to GTD
                </button>
              </div>
              <DialogActions onCancel={() => setEditingTask(null)} working={working} />
            </div>
          </form>
        </DialogFrame>
      ) : null}

      {dialog === "decision" ? (
        <DialogFrame
          title={editingDecision ? "Edit decision" : "Add decision"}
          onClose={() => {
            setDialog(null);
            setEditingDecision(null);
            setDecisionDraft(createEmptyDecisionDraft());
          }}
        >
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSaveDecision();
            }}
          >
            <DecisionFormFields draft={decisionDraft} onChange={setDecisionDraft} />
            <div className="flex items-center justify-between gap-3">
              {editingDecision ? (
                <button
                  type="button"
                  onClick={() => {
                    void handleDeleteDecision();
                  }}
                  className="rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
                >
                  Delete
                </button>
              ) : (
                <span />
              )}
              <DialogActions
                onCancel={() => {
                  setDialog(null);
                  setEditingDecision(null);
                  setDecisionDraft(createEmptyDecisionDraft());
                }}
                working={working}
                submitLabel={editingDecision ? "Save changes" : "Save decision"}
              />
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
                () => {
                  setDialog(null);
                },
              );
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

function DialogHelperCard({
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

function WorkspaceMutationOverlay({ open }: { open: boolean }) {
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

function DialogActions({
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

function TaskFormFields({
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

function DecisionFormFields({
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
  );
}
