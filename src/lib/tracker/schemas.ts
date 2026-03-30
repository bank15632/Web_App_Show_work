import { z } from "zod";

import {
  projectStatuses,
  reviewActions,
  trackerArtifactKinds,
  trackerPhases,
  trackerPriorities,
  trackerTaskStatuses,
  trackerTaskTypes,
} from "@/lib/tracker/constants";

export const trackerPhaseSchema = z.enum(trackerPhases);
export const trackerTaskStatusSchema = z.enum(trackerTaskStatuses);
export const trackerTaskTypeSchema = z.enum(trackerTaskTypes);
export const trackerArtifactKindSchema = z.enum(trackerArtifactKinds);
export const trackerPrioritySchema = z.enum(trackerPriorities);
export const trackerProjectStatusSchema = z.enum(projectStatuses);
export const reviewActionSchema = z.enum(reviewActions);
const taskSubtaskSchema = z.object({
  title: z.string().trim().min(1),
  completed: z.boolean().optional(),
});

export const projectMutationSchema = z.object({
  name: z.string().trim().min(1),
  clientName: z.string().trim().optional(),
  code: z.string().trim().optional(),
  projectType: z.string().trim().optional(),
  location: z.string().trim().optional(),
  phase: trackerPhaseSchema,
  status: trackerProjectStatusSchema.optional(),
  overview: z.string().trim().optional(),
  nextMilestone: z.string().trim().optional(),
  ownerNote: z.string().trim().optional(),
  area: z.string().trim().optional(),
  year: z.string().trim().optional(),
});

export const taskMutationSchema = z.object({
  phase: trackerPhaseSchema,
  taskType: trackerTaskTypeSchema,
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  status: trackerTaskStatusSchema,
  priority: trackerPrioritySchema,
  assignee: z.string().trim().optional(),
  dueDate: z.string().trim().nullable().optional(),
  location: z.string().trim().optional(),
  revision: z.string().trim().optional(),
  sourceType: z.string().trim().optional(),
  sourceRef: z.string().trim().optional(),
  sourceArtifactId: z.string().trim().nullable().optional(),
  nextAction: z.string().trim().optional(),
  blocker: z.string().trim().optional(),
  humanVerified: z.boolean().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
  subtasks: z.array(taskSubtaskSchema).optional(),
});

export const decisionMutationSchema = z.object({
  title: z.string().trim().min(1),
  decisionText: z.string().trim().min(1),
  decidedBy: z.string().trim().optional(),
  decidedAt: z.string().trim().optional(),
  sourceArtifactId: z.string().trim().nullable().optional(),
});

export const taskReorderSchema = z.object({
  projectId: z.string().trim().min(1),
  tasks: z.array(
    z.object({
      taskId: z.string().trim().min(1),
      status: trackerTaskStatusSchema,
      sortOrder: z.number().int().nonnegative(),
    }),
  ),
});

export const checklistMutationSchema = z.object({
  itemId: z.string().trim().min(1),
  completed: z.boolean(),
});

export const checklistCreateSchema = z.object({
  sectionKey: z.string().trim().min(1),
  label: z.string().trim().min(1),
  description: z.string().trim().optional().default(""),
});

export const checklistRemoveSchema = z.object({
  itemId: z.string().trim().min(1),
});

export const checklistRestoreSchema = z.object({
  itemKey: z.string().trim().min(1),
});

export const reviewRejectSchema = z.object({
  reason: z.string().trim().min(1),
  reviewedBy: z.string().trim().optional(),
});

export const meetingNoteIngestSchema = z.object({
  projectId: z.string().trim().min(1),
  title: z.string().trim().min(1),
  content: z.string().trim().min(1),
});

export const logIngestSchema = z.object({
  projectId: z.string().trim().min(1),
  title: z.string().trim().min(1),
  content: z.string().trim().min(1),
  kind: z.enum(["rfi_log", "submittal_log", "drawing_revision"]),
});

export const weeklyReportSchema = z.object({
  projectId: z.string().trim().min(1),
});

export const trackerQuerySchema = z.object({
  projectId: z.string().trim().optional(),
  question: z.string().trim().min(1),
});

export const legacyImportSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().trim().optional(),
      title: z.string().trim().min(1),
      description: z.string().trim().optional(),
      status: z.string().trim().optional(),
      priority: z.string().trim().optional(),
      projectSlug: z.string().trim().optional(),
      createdAt: z.string().trim().optional(),
      completedAt: z.string().trim().optional(),
    }),
  ),
});

export const aiProposalSchema = z.object({
  version: z.literal("v1"),
  action: reviewActionSchema,
  confidence: z.number().min(0).max(1),
  reasoningSummary: z.string().trim().min(1),
  entity: z.record(z.string(), z.any()),
});

export const aiGenerationSchema = z.object({
  artifactSummary: z.string().trim().optional().default(""),
  proposals: z.array(aiProposalSchema),
});
