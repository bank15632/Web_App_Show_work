import type {
  TrackerPhase,
  TrackerPriority,
  TrackerTaskMutationInput,
  TrackerTaskRecord,
  TrackerTaskType,
} from "@/lib/tracker/types";

const DAY_MS = 86_400_000;

export interface WorkflowContextDefinition {
  value: string;
  label: string;
  description: string;
  group: "classic" | "creative" | "delivery";
}

export const workflowContextDefinitions = [
  {
    value: "computer",
    label: "@computer",
    description: "Desktop work, docs, admin, and structured execution.",
    group: "classic",
  },
  {
    value: "phone",
    label: "@phone",
    description: "Calls, voice approvals, and quick follow-ups.",
    group: "classic",
  },
  {
    value: "site",
    label: "@site",
    description: "On-site checks, punch items, and physical verification.",
    group: "classic",
  },
  {
    value: "office",
    label: "@office",
    description: "Work that needs the studio, desk setup, or office tools.",
    group: "classic",
  },
  {
    value: "errands",
    label: "@errands",
    description: "Pickups, purchases, and outside-the-desk tasks.",
    group: "classic",
  },
  {
    value: "home",
    label: "@home",
    description: "Home-admin work or quiet solo tasks outside the studio.",
    group: "classic",
  },
  {
    value: "research",
    label: "@research",
    description: "Gather references, compare options, and study before deciding.",
    group: "creative",
  },
  {
    value: "writing",
    label: "@writing",
    description: "Scripts, outlines, captions, copy, and content structure.",
    group: "creative",
  },
  {
    value: "recording",
    label: "@recording",
    description: "Voiceover, screen capture, filming, or raw source capture.",
    group: "creative",
  },
  {
    value: "editing",
    label: "@editing",
    description: "Edit passes, polish, revisions, and visual assembly.",
    group: "creative",
  },
  {
    value: "review",
    label: "@review",
    description: "Internal QA, proofing, sign-off prep, and decision checks.",
    group: "creative",
  },
  {
    value: "publish",
    label: "@publish",
    description: "Final export, upload, client release, and live checks.",
    group: "delivery",
  },
  {
    value: "client_followup",
    label: "@client-followup",
    description: "Waiting items, approvals, and client-facing next steps.",
    group: "delivery",
  },
  {
    value: "admin",
    label: "@admin",
    description: "Invoices, cleanup, tracking, and operating-system work.",
    group: "delivery",
  },
] as const satisfies readonly WorkflowContextDefinition[];

export type WorkflowContextValue = (typeof workflowContextDefinitions)[number]["value"];

export interface CaptureRuleCard {
  title: string;
  body: string;
  example: string;
}

export const phaseTwoCaptureRules: CaptureRuleCard[] = [
  {
    title: "Capture the raw thing first",
    body: "Keep inbox capture short and frictionless. Clarify bucket, context, and due date only after the thought is safely stored.",
    example: "Example: `Revise school meeting room hero copy`",
  },
  {
    title: "Use creative contexts when the next move is obvious",
    body: "If the work already implies a mode like writing, editing, review, or publish, tag that context immediately so the next-action list stays honest.",
    example: "Example: `Storyboard teaser update` -> @writing",
  },
  {
    title: "Only send execution-ready work to Kanban",
    body: "Kanban should hold tasks that are clear enough to execute. Anything still fuzzy, waiting for input, or just an idea should live in GTD first.",
    example: "Example: after brief + owner + first step are clear, then send to Kanban",
  },
];

interface StarterTaskBlueprint {
  title: string;
  description: string;
  taskType: TrackerTaskType;
  priority: TrackerPriority;
  nextAction: string;
  subtasks?: string[];
}

export interface TrackerProjectTypeTemplate {
  value: string;
  label: string;
  description: string;
  defaultPhase: TrackerPhase;
  pipelineSummary: string;
  pipelineSteps: string[];
  suggestedTaskTypes: TrackerTaskType[];
  recommendedContexts: WorkflowContextValue[];
  starterTasks: StarterTaskBlueprint[];
}

const genericStarterTasks: StarterTaskBlueprint[] = [
  {
    title: "Define scope and success criteria",
    description: "Lock the outcome, owner, and first deliverable before execution spreads.",
    taskType: "meeting_followup",
    priority: "high",
    nextAction: "Write the one-paragraph brief and confirm owner.",
    subtasks: ["Outcome confirmed", "Owner confirmed", "First milestone written"],
  },
  {
    title: "Break the work into the first active tasks",
    description: "Create the first few cards that will actually move the project this week.",
    taskType: "coordination",
    priority: "medium",
    nextAction: "Split the work into 2-4 concrete actions.",
    subtasks: ["List the first tasks", "Set priorities", "Assign due dates if known"],
  },
  {
    title: "Review and prepare for delivery",
    description: "Keep a review gate so the project does not jump from doing to done without QA.",
    taskType: "approval",
    priority: "medium",
    nextAction: "Decide what must be checked before this goes live.",
    subtasks: ["Review checklist noted", "Delivery path confirmed"],
  },
];

export const trackerProjectTypeTemplates = [
  {
    value: "Internal",
    label: "Internal",
    description: "Studio operations, admin cleanup, process work, and one-person internal initiatives.",
    defaultPhase: "concept",
    pipelineSummary: "Define -> Organize -> Review -> Close",
    pipelineSteps: ["Define", "Organize", "Review", "Close"],
    suggestedTaskTypes: ["meeting_followup", "coordination", "approval"],
    recommendedContexts: ["admin", "computer", "review"],
    starterTasks: [
      {
        title: "Define the internal outcome",
        description: "State the result so the work does not become open-ended admin drift.",
        taskType: "meeting_followup",
        priority: "high",
        nextAction: "Write the intended outcome in one sentence.",
        subtasks: ["Outcome written", "Owner confirmed"],
      },
      {
        title: "Organize the next admin or cleanup actions",
        description: "Break the work into small, finishable pieces that fit your week.",
        taskType: "coordination",
        priority: "medium",
        nextAction: "List the next 2-3 admin steps.",
        subtasks: ["First action chosen", "Dependencies checked"],
      },
      {
        title: "Close the loop and archive the result",
        description: "Wrap up notes, links, or exports so internal work does not need to be rediscovered later.",
        taskType: "approval",
        priority: "medium",
        nextAction: "Decide what should be saved or documented at finish.",
        subtasks: ["Final note saved", "Reference link stored"],
      },
    ],
  },
  {
    value: "Website",
    label: "Website",
    description: "Landing pages, brand sites, microsites, and other web experiences that move from scope to live page.",
    defaultPhase: "concept",
    pipelineSummary: "Brief -> Structure -> Build -> QA -> Publish",
    pipelineSteps: ["Brief", "Structure", "Build", "QA", "Publish"],
    suggestedTaskTypes: ["design", "coordination", "approval"],
    recommendedContexts: ["research", "writing", "review", "publish"],
    starterTasks: [
      {
        title: "Confirm website brief and page goals",
        description: "Lock the audience, key message, and primary conversion target before designing.",
        taskType: "coordination",
        priority: "high",
        nextAction: "Confirm page goal, audience, and CTA.",
        subtasks: ["Audience defined", "Primary CTA defined", "Key sections listed"],
      },
      {
        title: "Draft sitemap and content structure",
        description: "Plan the page or site flow so design and copy work from the same frame.",
        taskType: "design",
        priority: "medium",
        nextAction: "Outline the sections or page hierarchy.",
        subtasks: ["Section order drafted", "Core copy blocks identified"],
      },
      {
        title: "Prepare live build and QA checklist",
        description: "Reserve a clear final step for responsive checks, link checks, and publish readiness.",
        taskType: "approval",
        priority: "medium",
        nextAction: "List the QA checks required before launch.",
        subtasks: ["Responsive check listed", "Link / form check listed", "Publish owner confirmed"],
      },
    ],
  },
  {
    value: "Content / Anime",
    label: "Content / Anime",
    description: "Videos, anime pieces, YouTube content, campaigns, and other creative work that passes through script, edit, and publish.",
    defaultPhase: "concept",
    pipelineSummary: "Brief -> Script -> Produce -> Edit -> Review -> Publish",
    pipelineSteps: ["Brief", "Script", "Produce", "Edit", "Review", "Publish"],
    suggestedTaskTypes: ["design", "meeting_followup", "approval"],
    recommendedContexts: ["writing", "recording", "editing", "review", "publish"],
    starterTasks: [
      {
        title: "Lock the content brief and outcome",
        description: "Define what the piece must say, for whom, and how success will be judged.",
        taskType: "meeting_followup",
        priority: "high",
        nextAction: "Confirm audience, format, and publish target.",
        subtasks: ["Audience defined", "Format confirmed", "Publish target noted"],
      },
      {
        title: "Create script or storyboard pass",
        description: "Start the content from a clear structure so edit and review rounds stay tighter.",
        taskType: "design",
        priority: "high",
        nextAction: "Produce the first script or storyboard pass.",
        subtasks: ["Opening drafted", "Main beats drafted", "Review questions listed"],
      },
      {
        title: "Set review and publish handoff",
        description: "Make the last mile explicit so finished content does not stall before release.",
        taskType: "approval",
        priority: "medium",
        nextAction: "Document the approval path and export requirements.",
        subtasks: ["Review owner confirmed", "Export settings noted", "Publish path confirmed"],
      },
    ],
  },
  {
    value: "Client Room",
    label: "Client Room",
    description: "Client-facing room pages, presentation hubs, and deliverable showcases that need clear assets, thumbnails, and a publish gate.",
    defaultPhase: "concept",
    pipelineSummary: "Assets -> Structure -> Build -> Review -> Live",
    pipelineSteps: ["Assets", "Structure", "Build", "Review", "Live"],
    suggestedTaskTypes: ["coordination", "design", "approval"],
    recommendedContexts: ["research", "review", "publish", "client_followup"],
    starterTasks: [
      {
        title: "Collect client room assets and thumbnail",
        description: "Gather cover image, supporting files, and status information before building the room.",
        taskType: "coordination",
        priority: "high",
        nextAction: "Confirm which assets and thumbnail represent the work.",
        subtasks: ["Thumbnail chosen", "Core files listed", "Status confirmed"],
      },
      {
        title: "Draft client room structure",
        description: "Plan the order of sections, labels, and navigation before styling the room.",
        taskType: "design",
        priority: "medium",
        nextAction: "Outline the room sections and their order.",
        subtasks: ["Section order drafted", "Supporting notes added"],
      },
      {
        title: "Prepare live publish and client checks",
        description: "Use one explicit task for final QA, share links, and publish confirmation.",
        taskType: "approval",
        priority: "medium",
        nextAction: "List the final checks before the room goes live.",
        subtasks: ["Share link checked", "Live copy reviewed", "Client-facing note prepared"],
      },
    ],
  },
  {
    value: "Design Delivery",
    label: "Design Delivery",
    description: "Architecture and design projects that move through brief, coordination, package development, and issue rounds.",
    defaultPhase: "concept",
    pipelineSummary: "Brief -> Design -> Coordinate -> Issue -> Review",
    pipelineSteps: ["Brief", "Design", "Coordinate", "Issue", "Review"],
    suggestedTaskTypes: ["design", "coordination", "approval", "submittal"],
    recommendedContexts: ["research", "review", "site", "client_followup"],
    starterTasks: [
      {
        title: "Confirm brief and site inputs",
        description: "Make sure the project starts from complete base data before design work grows.",
        taskType: "coordination",
        priority: "high",
        nextAction: "Verify brief, site info, and missing constraints.",
        subtasks: ["Brief checked", "Site inputs checked", "Constraints listed"],
      },
      {
        title: "Build the first design package",
        description: "Create the first package or concept set that downstream coordination can react to.",
        taskType: "design",
        priority: "high",
        nextAction: "Define the first package scope for this phase.",
        subtasks: ["Package scope noted", "Output list defined"],
      },
      {
        title: "Set issue and review readiness",
        description: "Reserve time for internal QC and delivery gating before sending drawings or revisions out.",
        taskType: "approval",
        priority: "medium",
        nextAction: "List the QC checks needed before issue.",
        subtasks: ["QC checklist noted", "Review owner confirmed", "Issue target noted"],
      },
    ],
  },
] satisfies TrackerProjectTypeTemplate[];

const trackerProjectTypeAliasMap = new Map<string, TrackerProjectTypeTemplate>();

for (const template of trackerProjectTypeTemplates) {
  registerProjectTypeAlias(template, template.value);
  registerProjectTypeAlias(template, template.label);
}

registerProjectTypeAlias(trackerProjectTypeTemplates[0], "ops");
registerProjectTypeAlias(trackerProjectTypeTemplates[0], "admin");
registerProjectTypeAlias(trackerProjectTypeTemplates[1], "web");
registerProjectTypeAlias(trackerProjectTypeTemplates[1], "landing page");
registerProjectTypeAlias(trackerProjectTypeTemplates[1], "website");
registerProjectTypeAlias(trackerProjectTypeTemplates[2], "content");
registerProjectTypeAlias(trackerProjectTypeTemplates[2], "anime");
registerProjectTypeAlias(trackerProjectTypeTemplates[2], "youtube");
registerProjectTypeAlias(trackerProjectTypeTemplates[3], "client room");
registerProjectTypeAlias(trackerProjectTypeTemplates[3], "client-room");
registerProjectTypeAlias(trackerProjectTypeTemplates[3], "client_room");
registerProjectTypeAlias(trackerProjectTypeTemplates[4], "aec");
registerProjectTypeAlias(trackerProjectTypeTemplates[4], "design");
registerProjectTypeAlias(trackerProjectTypeTemplates[4], "architecture");

export const defaultTrackerProjectType = trackerProjectTypeTemplates[0].value;

export function getWorkflowContextDefinition(value: string | null | undefined) {
  const normalized = normalizeKey(value);
  return workflowContextDefinitions.find((entry) => normalizeKey(entry.value) === normalized) ?? null;
}

export function getWorkflowContextLabel(value: string | null | undefined) {
  return getWorkflowContextDefinition(value)?.label ?? "No context";
}

export function getTrackerProjectTypeTemplate(projectType: string | null | undefined) {
  const normalized = normalizeKey(projectType);

  if (!normalized) {
    return trackerProjectTypeTemplates[0];
  }

  return trackerProjectTypeAliasMap.get(normalized) ?? buildCustomProjectTypeTemplate(projectType ?? "");
}

export function buildStarterTasksForProjectType({
  phase,
  projectType,
  location,
}: {
  phase: TrackerPhase;
  projectType: string | null | undefined;
  location?: string | null;
}): TrackerTaskMutationInput[] {
  const template = getTrackerProjectTypeTemplate(projectType);

  return template.starterTasks.map((task) => ({
    phase,
    taskType: task.taskType,
    title: task.title,
    description: task.description,
    status: "todo",
    priority: task.priority,
    location: location ?? "",
    nextAction: task.nextAction,
    humanVerified: true,
    sourceType: "template.phase2",
    sourceRef: `project-type:${template.value}`,
    subtasks: task.subtasks?.map((title) => ({ title, completed: false })),
  }));
}

export function buildProjectTypeDistribution<T extends { projectType?: string | null }>(projects: T[]) {
  const counts = new Map<string, number>();

  for (const project of projects) {
    const template = getTrackerProjectTypeTemplate(project.projectType);
    counts.set(template.label, (counts.get(template.label) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label));
}

export function buildContextDistribution<
  T extends { context?: string | null; done?: boolean },
>(items: T[]) {
  const counts = new Map<string, number>();

  for (const item of items) {
    if (item.done) continue;
    const definition = getWorkflowContextDefinition(item.context);
    if (!definition) continue;
    counts.set(definition.label, (counts.get(definition.label) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label));
}

export interface PersonalTrackerMetrics {
  throughput7d: number;
  throughput30d: number;
  averageLeadTimeDays: number;
  onTimeRate: number;
  scheduledCompletions: number;
  staleOpenCount: number;
  openWithoutDueDate: number;
  activeDoingCount: number;
}

export function buildPersonalTrackerMetrics(tasks: TrackerTaskRecord[], referenceTime: number) {
  const completedTasks = tasks.filter((task) => task.completedAt);
  const throughput7d = completedTasks.filter((task) =>
    isWithinWindow(task.completedAt, referenceTime, 7),
  ).length;
  const throughput30d = completedTasks.filter((task) =>
    isWithinWindow(task.completedAt, referenceTime, 30),
  ).length;
  const leadTimes = completedTasks
    .map((task) => {
      const completedAt = new Date(task.completedAt ?? "").getTime();
      const createdAt = new Date(task.createdAt).getTime();
      if (Number.isNaN(completedAt) || Number.isNaN(createdAt) || completedAt < createdAt) {
        return null;
      }
      return (completedAt - createdAt) / DAY_MS;
    })
    .filter((value): value is number => value !== null);
  const scheduledCompletions = completedTasks.filter((task) => task.dueDate).length;
  const onTimeCompletions = completedTasks.filter(
    (task) => task.dueDate && (task.lateDays ?? 0) <= 0,
  ).length;
  const staleOpenCount = tasks.filter((task) => {
    if (task.status === "done") return false;
    const updatedAt = new Date(task.updatedAt).getTime();
    return !Number.isNaN(updatedAt) && referenceTime - updatedAt >= DAY_MS * 14;
  }).length;
  const openWithoutDueDate = tasks.filter(
    (task) => task.status !== "done" && !task.dueDate,
  ).length;
  const activeDoingCount = tasks.filter((task) => task.status === "doing").length;

  return {
    throughput7d,
    throughput30d,
    averageLeadTimeDays:
      leadTimes.length > 0
        ? Math.round((leadTimes.reduce((sum, value) => sum + value, 0) / leadTimes.length) * 10) /
          10
        : 0,
    onTimeRate:
      scheduledCompletions > 0
        ? Math.round((onTimeCompletions / scheduledCompletions) * 100)
        : 0,
    scheduledCompletions,
    staleOpenCount,
    openWithoutDueDate,
    activeDoingCount,
  } satisfies PersonalTrackerMetrics;
}

function registerProjectTypeAlias(template: TrackerProjectTypeTemplate, alias: string) {
  trackerProjectTypeAliasMap.set(normalizeKey(alias), template);
}

function normalizeKey(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function buildCustomProjectTypeTemplate(label: string): TrackerProjectTypeTemplate {
  const safeLabel = label.trim() || "Custom";

  return {
    value: safeLabel,
    label: safeLabel,
    description: "Custom workflow type. Use the template as a starting point and adjust the first tasks for this project.",
    defaultPhase: "concept",
    pipelineSummary: "Define -> Build -> Review -> Deliver",
    pipelineSteps: ["Define", "Build", "Review", "Deliver"],
    suggestedTaskTypes: ["design", "coordination", "approval"],
    recommendedContexts: ["computer", "review", "admin"],
    starterTasks: genericStarterTasks,
  };
}

function isWithinWindow(timestamp: string | null, referenceTime: number, days: number) {
  if (!timestamp) return false;
  const time = new Date(timestamp).getTime();
  if (Number.isNaN(time)) return false;
  return referenceTime - time <= DAY_MS * days;
}
