import type {
  artifactKindLabels,
  domainTabs,
  priorityLabels,
  projectStatuses,
  reviewActions,
  reviewStatuses,
  savedViews,
  taskStatusLabels,
  taskTypeLabels,
  trackerArtifactKinds,
  trackerPhases,
  trackerPriorities,
  trackerTaskStatuses,
  trackerTaskTypes,
} from "@/lib/tracker/constants";

export type TrackerPhase = (typeof trackerPhases)[number];
export type TrackerTaskStatus = (typeof trackerTaskStatuses)[number];
export type TrackerTaskType = (typeof trackerTaskTypes)[number];
export type TrackerArtifactKind = (typeof trackerArtifactKinds)[number];
export type TrackerPriority = (typeof trackerPriorities)[number];
export type TrackerReviewStatus = (typeof reviewStatuses)[number];
export type TrackerReviewAction = (typeof reviewActions)[number];
export type TrackerProjectStatus = (typeof projectStatuses)[number];
export type TrackerSavedView = (typeof savedViews)[number];
export type TrackerDomainTab = (typeof domainTabs)[number];

export interface TrackerProjectRecord {
  id: string;
  slug: string;
  code: string;
  name: string;
  clientName: string;
  projectType: string;
  location: string;
  phase: TrackerPhase;
  status: TrackerProjectStatus;
  overview: string;
  nextMilestone: string;
  ownerNote: string;
  area: string;
  year: string;
  sourcePortalSlug: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrackerSubtaskRecord {
  id: string;
  title: string;
  completed: boolean;
  sortOrder: number;
}

export interface TrackerTaskRecord {
  id: string;
  projectId: string;
  phase: TrackerPhase;
  taskType: TrackerTaskType;
  title: string;
  description: string;
  status: TrackerTaskStatus;
  priority: TrackerPriority;
  assignee: string;
  dueDate: string | null;
  location: string;
  revision: string;
  sourceType: string;
  sourceRef: string;
  sourceArtifactId: string | null;
  nextAction: string;
  blocker: string;
  humanVerified: boolean;
  sortOrder: number;
  createdFromReviewId: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  lateDays: number | null;
  subtasks: TrackerSubtaskRecord[];
}

export interface TrackerDecisionRecord {
  id: string;
  projectId: string;
  title: string;
  decisionText: string;
  decidedBy: string;
  decidedAt: string;
  sourceArtifactId: string | null;
  createdFromReviewId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrackerArtifactRecord {
  id: string;
  projectId: string;
  kind: TrackerArtifactKind;
  title: string;
  fileName: string | null;
  filePath: string | null;
  mimeType: string | null;
  revision: string;
  extractedSummary: string;
  sourceText: string;
  metadataJson: string;
  createdFromReviewId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrackerChecklistItemRecord {
  id: string;
  projectId: string;
  phase: TrackerPhase;
  sectionKey: string;
  itemKey: string;
  label: string | null;
  description: string | null;
  isCustom: boolean;
  completed: boolean;
  sortOrder: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrackerHiddenChecklistItemRecord {
  projectId: string;
  phase: TrackerPhase;
  sectionKey: string;
  sectionTitle: string;
  itemKey: string;
  label: string;
  description: string;
  sortOrder: number;
}

export interface TrackerReviewProposal<
  Action extends TrackerReviewAction = TrackerReviewAction,
  Entity = unknown,
> {
  version: "v1";
  action: Action;
  projectId: string;
  sourceArtifactId: string | null;
  confidence: number;
  reasoningSummary: string;
  entity: Entity;
}

export interface TrackerReviewItemRecord {
  id: string;
  projectId: string;
  sourceArtifactId: string | null;
  action: TrackerReviewAction;
  status: TrackerReviewStatus;
  confidence: number;
  reasoningSummary: string;
  proposalJson: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrackerAuditLogRecord {
  id: string;
  projectId: string;
  reviewItemId: string | null;
  entityKind: string;
  entityId: string | null;
  action: string;
  actor: string;
  payloadJson: string;
  createdAt: string;
}

export interface TrackerProjectDetail extends TrackerProjectRecord {
  tasks: TrackerTaskRecord[];
  decisions: TrackerDecisionRecord[];
  artifacts: TrackerArtifactRecord[];
  checklistItems: TrackerChecklistItemRecord[];
  hiddenChecklistItems: TrackerHiddenChecklistItemRecord[];
}

export interface TrackerWorkspaceData {
  generatedAt: string;
  projects: TrackerProjectDetail[];
  reviewItems: TrackerReviewItemRecord[];
}

export interface TrackerTaskMutationInput {
  phase: TrackerPhase;
  taskType: TrackerTaskType;
  title: string;
  description?: string;
  status: TrackerTaskStatus;
  priority: TrackerPriority;
  assignee?: string;
  dueDate?: string | null;
  location?: string;
  revision?: string;
  sourceType?: string;
  sourceRef?: string;
  sourceArtifactId?: string | null;
  nextAction?: string;
  blocker?: string;
  humanVerified?: boolean;
  sortOrder?: number;
  subtasks?: Array<{
    title: string;
    completed?: boolean;
  }>;
}

export interface TrackerDecisionMutationInput {
  title: string;
  decisionText: string;
  decidedBy?: string;
  decidedAt?: string;
  sourceArtifactId?: string | null;
}

export interface TrackerArtifactMutationInput {
  projectId: string;
  kind: TrackerArtifactKind;
  title: string;
  fileName?: string | null;
  filePath?: string | null;
  mimeType?: string | null;
  revision?: string;
  extractedSummary?: string;
  sourceText?: string;
  metadataJson?: string;
  createdFromReviewId?: string | null;
}

export interface TrackerProjectMutationInput {
  name: string;
  slug?: string;
  clientName?: string;
  code?: string;
  projectType?: string;
  seedTemplateTasks?: boolean;
  location?: string;
  phase: TrackerPhase;
  status?: TrackerProjectStatus;
  overview?: string;
  nextMilestone?: string;
  ownerNote?: string;
  area?: string;
  year?: string;
  sourcePortalSlug?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface TrackerLegacyTodoImport {
  id?: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  projectSlug?: string;
  createdAt?: string;
  completedAt?: string;
}

export interface TrackerBoardMove {
  taskId: string;
  status: TrackerTaskStatus;
  sortOrder: number;
}

export interface TrackerChecklistMutationInput {
  itemId: string;
  completed: boolean;
}

export interface TrackerChecklistCreateInput {
  sectionKey: string;
  label: string;
  description?: string;
}

export interface TrackerChecklistRemoveInput {
  itemId: string;
}

export interface TrackerChecklistRestoreInput {
  itemKey: string;
}

export interface TrackerQueryResult {
  answer: string;
  snippets: string[];
}

export interface TrackerAiGenerationResult {
  artifact: TrackerArtifactRecord;
  reviewItems: TrackerReviewItemRecord[];
  provider: "openai" | "heuristic";
}

export interface TrackerReviewResolution {
  reviewItem: TrackerReviewItemRecord;
  workspace: TrackerWorkspaceData;
}

export type TrackerLabelMaps = {
  taskStatuses: typeof taskStatusLabels;
  taskTypes: typeof taskTypeLabels;
  artifactKinds: typeof artifactKindLabels;
  priorities: typeof priorityLabels;
};
