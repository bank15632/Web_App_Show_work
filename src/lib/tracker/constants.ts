export const trackerPhases = [
  "concept",
  "schematic",
  "design_development",
  "construction_documents",
  "tender",
  "construction",
  "handover",
] as const;

export const trackerTaskStatuses = [
  "todo",
  "doing",
  "waiting",
  "blocked",
  "done",
] as const;

export const trackerTaskTypes = [
  "design",
  "coordination",
  "approval",
  "rfi",
  "submittal",
  "site_issue",
  "punch_list",
  "procurement",
  "meeting_followup",
] as const;

export const trackerArtifactKinds = [
  "meeting_note",
  "drawing_revision",
  "site_photo",
  "site_markup",
  "rfi_log",
  "submittal_log",
  "weekly_report",
] as const;

export const trackerPriorities = ["low", "medium", "high"] as const;

export const reviewStatuses = ["pending", "approved", "rejected"] as const;

export const reviewActions = [
  "task.create",
  "task.update",
  "decision.create",
  "artifact.summary",
  "report.weekly",
] as const;

export const projectStatuses = ["active", "on_hold", "done"] as const;

export const savedViews = [
  "today",
  "this_week",
  "waiting_on",
  "overdue",
  "rfis",
  "submittals",
  "site_issues",
  "revision_log",
  "punch_list",
  "weekly_report",
] as const;

export const domainTabs = [
  "tasks",
  "decisions",
  "revision_log",
  "weekly_report",
  "review_queue",
] as const;

export const phaseLabels = {
  concept: "Concept",
  schematic: "Schematic",
  design_development: "Design Development",
  construction_documents: "Construction Documents",
  tender: "Tender",
  construction: "Construction",
  handover: "Handover",
} satisfies Record<(typeof trackerPhases)[number], string>;

export const phaseAccents = {
  concept: "#9f7aea",
  schematic: "#0ea5e9",
  design_development: "#f97316",
  construction_documents: "#111827",
  tender: "#d97706",
  construction: "#0f766e",
  handover: "#15803d",
} satisfies Record<(typeof trackerPhases)[number], string>;

export const taskStatusLabels = {
  todo: "To Do",
  doing: "Doing",
  waiting: "Waiting",
  blocked: "Blocked",
  done: "Done",
} satisfies Record<(typeof trackerTaskStatuses)[number], string>;

export const taskStatusTone = {
  todo: "border-stone-200 bg-stone-50 text-stone-700",
  doing: "border-sky-200 bg-sky-50 text-sky-700",
  waiting: "border-amber-200 bg-amber-50 text-amber-700",
  blocked: "border-rose-200 bg-rose-50 text-rose-700",
  done: "border-emerald-200 bg-emerald-50 text-emerald-700",
} satisfies Record<(typeof trackerTaskStatuses)[number], string>;

export const taskTypeLabels = {
  design: "Design",
  coordination: "Coordination",
  approval: "Approval",
  rfi: "RFI",
  submittal: "Submittal",
  site_issue: "Site Issue",
  punch_list: "Punch List",
  procurement: "Procurement",
  meeting_followup: "Meeting Follow-up",
} satisfies Record<(typeof trackerTaskTypes)[number], string>;

export const artifactKindLabels = {
  meeting_note: "Meeting Note",
  drawing_revision: "Drawing Revision",
  site_photo: "Site Photo",
  site_markup: "Site Markup",
  rfi_log: "RFI Log",
  submittal_log: "Submittal Log",
  weekly_report: "Weekly Report",
} satisfies Record<(typeof trackerArtifactKinds)[number], string>;

export const priorityLabels = {
  low: "Low",
  medium: "Medium",
  high: "High",
} satisfies Record<(typeof trackerPriorities)[number], string>;

export const priorityTone = {
  low: "border-stone-200 bg-stone-100 text-stone-700",
  medium: "border-amber-200 bg-amber-100 text-amber-700",
  high: "border-rose-200 bg-rose-100 text-rose-700",
} satisfies Record<(typeof trackerPriorities)[number], string>;

export const savedViewLabels = {
  today: "Today",
  this_week: "This Week",
  waiting_on: "Waiting On",
  overdue: "Overdue",
  rfis: "RFIs",
  submittals: "Submittals",
  site_issues: "Site Issues",
  revision_log: "Revision Log",
  punch_list: "Punch List",
  weekly_report: "Weekly Report",
} satisfies Record<(typeof savedViews)[number], string>;

export const trackerStorageKeys = {
  legacyTodos: "bnj-todos",
  legacyTracker: "bnj-arch-tracker-v1",
  imported: "bnj-ai-tracker-imported-v1",
} as const;

export const trackerModelDefault = "gpt-5-mini";
