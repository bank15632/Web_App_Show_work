import { getDefaultTodos, getProjects } from "@/lib/portal-data";
import type {
  TrackerArtifactMutationInput,
  TrackerDecisionMutationInput,
  TrackerProjectMutationInput,
  TrackerTaskMutationInput,
} from "@/lib/tracker/types";

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

function nowFromDate(value: string) {
  return new Date(value).toISOString();
}

function mapStageToPhase(stage: string, title: string) {
  if (stage === "concept") return "concept";
  if (stage === "construction") return "construction";
  if (title.toLowerCase().includes("construction drawing"))
    return "construction_documents";
  if (title.toLowerCase().includes("boq")) return "tender";
  return "design_development";
}

function mapTodoStatus(status: string) {
  switch (status) {
    case "completed":
      return "done";
    case "in-progress":
      return "doing";
    default:
      return "todo";
  }
}

export interface TrackerSeedBundle {
  projects: TrackerProjectMutationInput[];
  tasks: Array<TrackerTaskMutationInput & { projectSlug: string; createdAt: string; completedAt: string | null }>;
  decisions: Array<TrackerDecisionMutationInput & { projectSlug: string }>;
  artifacts: Array<TrackerArtifactMutationInput & { projectSlug: string; createdAt: string }>;
}

export function buildTrackerSeedBundle(): TrackerSeedBundle {
  const projects = getProjects();
  const todos = getDefaultTodos();

  return {
    projects: projects.map((project) => ({
      name: project.title,
      slug: project.slug,
      clientName: project.clientName,
      code: project.code,
      projectType: project.projectType,
      location: project.location,
      phase: mapStageToPhase(
        project.stage,
        project.sections.map((section) => section.title).join(" "),
      ),
      overview: project.overview,
      nextMilestone: project.nextMilestone,
      ownerNote: project.ownerNote,
      area: project.area,
      year: project.year,
      status: project.stage === "archived" ? "done" : "active",
      sourcePortalSlug: project.slug,
      createdAt: nowFromDate(project.createdAt),
      updatedAt: nowFromDate(project.updatedAt),
    })),
    tasks: todos.map((todo) => ({
      projectSlug: todo.projectSlug ?? "general",
      phase: "design_development",
      taskType: todo.title.toLowerCase().includes("boq")
        ? "procurement"
        : todo.title.toLowerCase().includes("site")
          ? "site_issue"
          : todo.title.toLowerCase().includes("timeline")
            ? "coordination"
            : todo.title.toLowerCase().includes("review")
              ? "approval"
              : "design",
      title: todo.title,
      description: todo.description ?? "",
      status: mapTodoStatus(todo.status),
      priority: todo.priority,
      assignee: "BNJ Studio",
      dueDate: todo.completedAt ?? todo.createdAt,
      location: "",
      revision: "",
      sourceType: "seed.todo",
      sourceRef: todo.projectSlug ?? "general",
      sourceArtifactId: null,
      nextAction: "",
      blocker: todo.status === "pending" ? "Pending review or client action" : "",
      humanVerified: true,
      createdAt: todo.createdAt,
      completedAt: todo.completedAt ?? null,
    })),
    decisions: projects.map((project) => ({
      projectSlug: project.slug,
      title: `Current direction for ${project.title}`,
      decisionText: project.ownerNote,
      decidedBy: "BNJ Studio",
      decidedAt: nowFromDate(project.updatedAt),
      sourceArtifactId: null,
    })),
    artifacts: projects.flatMap((project) =>
      project.sections.flatMap((section) =>
        section.items
          .filter((item) => item.latest)
          .map((item) => ({
            projectSlug: project.slug,
            projectId: "",
            kind: section.title.toLowerCase().includes("construction")
              ? "drawing_revision"
              : section.title.toLowerCase().includes("mood")
                ? "meeting_note"
                : section.title.toLowerCase().includes("boq")
                  ? "submittal_log"
                  : "drawing_revision",
            title: `${section.title} — ${item.title}`,
            fileName: `${slugify(item.title)}-${slugify(item.version)}.${item.kind === "pdf" ? "pdf" : "url"}`,
            filePath: null,
            mimeType: item.kind === "pdf" ? "application/pdf" : "text/uri-list",
            revision: item.version,
            extractedSummary: item.summary,
            sourceText: item.summary,
            metadataJson: JSON.stringify({
              documentId: item.id,
              sectionTitle: section.title,
              rooms: item.rooms ?? [],
            }),
            createdAt: nowFromDate(item.updatedAt),
          })),
      ),
    ),
  };
}
