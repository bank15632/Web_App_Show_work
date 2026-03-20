"use client";

import {
  startTransition,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Copy } from "lucide-react";

import { DomainTabs } from "@/components/portal/tracker/domain-tabs";
import { ProjectRail } from "@/components/portal/tracker/project-rail";
import { ReviewQueue } from "@/components/portal/tracker/review-queue";
import { SavedViewBar } from "@/components/portal/tracker/saved-view-bar";
import { TaskBoard } from "@/components/portal/tracker/task-board";
import { WeeklyReportPanel } from "@/components/portal/tracker/weekly-report-panel";
import { WorkspaceHeader } from "@/components/portal/tracker/workspace-header";
import {
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

  useEffect(() => {
    void loadWorkspace();
  }, []);

  useEffect(() => {
    if (!workspace || activeProjectId) return;
    setActiveProjectId(workspace.projects[0]?.id ?? null);
  }, [workspace, activeProjectId]);

  useEffect(() => {
    if (!workspace) return;
    if (window.localStorage.getItem(trackerStorageKeys.imported)) return;

    const items = readLegacyTodos();
    if (items.length === 0) {
      window.localStorage.setItem(trackerStorageKeys.imported, "1");
      return;
    }

    setWorking(true);
    requestJson<{ workspace: TrackerWorkspaceData }>("/api/tracker/import/legacy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    })
      .then((data) => {
        startTransition(() => {
          setWorkspace(data.workspace);
        });
        setStatusMessage(`Imported ${items.length} legacy todo item(s).`);
        window.localStorage.setItem(trackerStorageKeys.imported, "1");
      })
      .catch((error: unknown) => {
        setStatusMessage(
          error instanceof Error ? error.message : "Legacy import failed",
        );
      })
      .finally(() => {
        setWorking(false);
      });
  }, [workspace]);

  const activeProject = useMemo(() => {
    if (!workspace || !activeProjectId) return null;
    return workspace.projects.find((project) => project.id === activeProjectId) ?? null;
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
        <div className="text-center">
          <p className="caption-editorial">Tracker</p>
          <h1 className="mt-2 font-display text-4xl font-medium">No project workspace</h1>
        </div>
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
            <SidebarToggleButton
              collapsed={isLeftRailCollapsed}
              side="left"
              hideLabel="Hide projects"
              showLabel="Show projects"
              onClick={() => setIsLeftRailCollapsed((prev) => !prev)}
            />
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

          <div className="rounded-[1.5rem] border border-border bg-background/85 px-5 py-4 text-sm leading-7 text-muted-foreground">
            <p className="font-medium text-foreground">
              GTD inbox = ที่จับทุกอย่างที่เข้าหัว ส่วน Kanban board นี้ = งานที่ผ่านการ
              process แล้วและทีมต้องเห็น
            </p>
            <p className="mt-1">
              ตามคู่มือ ให้ capture งานส่วนตัวใน GTD ก่อน แล้วค่อยส่งงานที่เกี่ยวกับโปรเจกต์ขึ้น
              board นี้เมื่อ task ชัดเจนแล้ว
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link
                href="/gtd"
                className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
              >
                Open GTD workspace
              </Link>
              <Link
                href="/settings"
                className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
              >
                Settings & Export
              </Link>
            </div>
          </div>

          <WorkspaceHeader
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
