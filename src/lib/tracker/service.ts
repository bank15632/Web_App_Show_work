import type { D1Database } from "@cloudflare/workers-types";

import { trackerPhaseChecklistTemplates } from "@/lib/tracker/checklists";
import type { TrackerEnv } from "@/lib/tracker/env";
import {
  checklistCreateSchema,
  checklistMutationSchema,
  checklistRemoveSchema,
  checklistRestoreSchema,
  projectMutationSchema,
  taskMutationSchema,
} from "@/lib/tracker/schemas";
import { trackerMigrationSql } from "@/lib/tracker/sql";
import type {
  TrackerAiGenerationResult,
  TrackerArtifactMutationInput,
  TrackerArtifactRecord,
  TrackerAuditLogRecord,
  TrackerBoardMove,
  TrackerChecklistItemRecord,
  TrackerChecklistCreateInput,
  TrackerChecklistMutationInput,
  TrackerChecklistRemoveInput,
  TrackerChecklistRestoreInput,
  TrackerDecisionMutationInput,
  TrackerDecisionRecord,
  TrackerHiddenChecklistItemRecord,
  TrackerLegacyTodoImport,
  TrackerProjectDetail,
  TrackerProjectMutationInput,
  TrackerProjectRecord,
  TrackerQueryResult,
  TrackerReviewItemRecord,
  TrackerReviewProposal,
  TrackerReviewResolution,
  TrackerSubtaskRecord,
  TrackerTaskMutationInput,
  TrackerTaskRecord,
  TrackerWorkspaceData,
} from "@/lib/tracker/types";

type SqlPrimitive = string | number | null;

interface ProjectRow {
  id: string;
  slug: string;
  code: string;
  name: string;
  client_name: string;
  project_type: string;
  location: string;
  phase: string;
  status: string;
  overview: string;
  next_milestone: string;
  owner_note: string;
  area: string;
  year: string;
  source_portal_slug: string | null;
  created_at: string;
  updated_at: string;
}

interface TaskRow {
  id: string;
  project_id: string;
  phase: string;
  task_type: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee: string;
  due_date: string | null;
  location: string;
  revision: string;
  source_type: string;
  source_ref: string;
  source_artifact_id: string | null;
  next_action: string;
  blocker: string;
  human_verified: number;
  sort_order: number;
  created_from_review_id: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

interface TaskSubtaskRow {
  id: string;
  task_id: string;
  title: string;
  completed: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface DecisionRow {
  id: string;
  project_id: string;
  title: string;
  decision_text: string;
  decided_by: string;
  decided_at: string;
  source_artifact_id: string | null;
  created_from_review_id: string | null;
  created_at: string;
  updated_at: string;
}

interface ChecklistItemRow {
  id: string;
  project_id: string;
  phase: string;
  section_key: string;
  item_key: string;
  completed: number;
  sort_order: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface CustomChecklistItemRow {
  id: string;
  project_id: string;
  phase: string;
  section_key: string;
  label: string;
  description: string;
  completed: number;
  sort_order: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface HiddenChecklistItemRow {
  project_id: string;
  phase: string;
  item_key: string;
}

type ChecklistItemLookup = {
  item: TrackerChecklistItemRecord;
  source: "template" | "custom";
};

type ChecklistTemplateLookup = {
  sectionKey: string;
  sectionTitle: string;
  label: string;
  description: string;
  sortOrder: number;
};

interface ArtifactRow {
  id: string;
  project_id: string;
  kind: string;
  title: string;
  file_name: string | null;
  file_path: string | null;
  mime_type: string | null;
  revision: string;
  extracted_summary: string;
  source_text: string;
  metadata_json: string;
  created_from_review_id: string | null;
  created_at: string;
  updated_at: string;
}

interface ReviewItemRow {
  id: string;
  project_id: string;
  source_artifact_id: string | null;
  action: string;
  status: string;
  confidence: number;
  reasoning_summary: string;
  proposal_json: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface AuditLogRow {
  id: string;
  project_id: string;
  review_item_id: string | null;
  entity_kind: string;
  entity_id: string | null;
  action: string;
  actor: string;
  payload_json: string;
  created_at: string;
}

const readyByDb = new WeakMap<D1Database, Promise<void>>();

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function slugify(input: string) {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);

  return base || `tracker-${crypto.randomUUID().slice(0, 8)}`;
}

function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function toBoolean(value: number) {
  return value === 1;
}

async function execSqlBatch(db: D1Database, sql: string) {
  const statements = sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await db.prepare(statement).run();
  }
}

async function queryAll<Row extends object>(
  db: D1Database,
  sql: string,
  ...params: SqlPrimitive[]
) {
  const result = await db.prepare(sql).bind(...params).all<Row>();
  return result.results ?? [];
}

async function queryFirst<Row extends object>(
  db: D1Database,
  sql: string,
  ...params: SqlPrimitive[]
) {
  return db.prepare(sql).bind(...params).first<Row>();
}

async function runStatement(
  db: D1Database,
  sql: string,
  ...params: SqlPrimitive[]
) {
  return db.prepare(sql).bind(...params).run();
}

function mapProjectRow(row: ProjectRow): TrackerProjectRecord {
  return {
    id: row.id,
    slug: row.slug,
    code: row.code,
    name: row.name,
    clientName: row.client_name,
    projectType: row.project_type,
    location: row.location,
    phase: row.phase as TrackerProjectRecord["phase"],
    status: row.status as TrackerProjectRecord["status"],
    overview: row.overview,
    nextMilestone: row.next_milestone,
    ownerNote: row.owner_note,
    area: row.area,
    year: row.year,
    sourcePortalSlug: row.source_portal_slug,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTaskRow(row: TaskRow): TrackerTaskRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    phase: row.phase as TrackerTaskRecord["phase"],
    taskType: row.task_type as TrackerTaskRecord["taskType"],
    title: row.title,
    description: row.description,
    status: row.status as TrackerTaskRecord["status"],
    priority: row.priority as TrackerTaskRecord["priority"],
    assignee: row.assignee,
    dueDate: row.due_date,
    location: row.location,
    revision: row.revision,
    sourceType: row.source_type,
    sourceRef: row.source_ref,
    sourceArtifactId: row.source_artifact_id,
    nextAction: row.next_action,
    blocker: row.blocker,
    humanVerified: toBoolean(row.human_verified),
    sortOrder: row.sort_order,
    createdFromReviewId: row.created_from_review_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
    subtasks: [],
  };
}

function mapTaskSubtaskRow(row: TaskSubtaskRow): TrackerSubtaskRecord {
  return {
    id: row.id,
    title: row.title,
    completed: toBoolean(row.completed),
    sortOrder: row.sort_order,
  };
}

function mapDecisionRow(row: DecisionRow): TrackerDecisionRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    decisionText: row.decision_text,
    decidedBy: row.decided_by,
    decidedAt: row.decided_at,
    sourceArtifactId: row.source_artifact_id,
    createdFromReviewId: row.created_from_review_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapArtifactRow(row: ArtifactRow): TrackerArtifactRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    kind: row.kind as TrackerArtifactRecord["kind"],
    title: row.title,
    fileName: row.file_name,
    filePath: row.file_path,
    mimeType: row.mime_type,
    revision: row.revision,
    extractedSummary: row.extracted_summary,
    sourceText: row.source_text,
    metadataJson: row.metadata_json,
    createdFromReviewId: row.created_from_review_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapChecklistItemRow(row: ChecklistItemRow): TrackerChecklistItemRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    phase: row.phase as TrackerChecklistItemRecord["phase"],
    sectionKey: row.section_key,
    itemKey: row.item_key,
    label: null,
    description: null,
    isCustom: false,
    completed: toBoolean(row.completed),
    sortOrder: row.sort_order,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCustomChecklistItemRow(
  row: CustomChecklistItemRow,
): TrackerChecklistItemRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    phase: row.phase as TrackerChecklistItemRecord["phase"],
    sectionKey: row.section_key,
    itemKey: row.id,
    label: row.label,
    description: row.description,
    isCustom: true,
    completed: toBoolean(row.completed),
    sortOrder: row.sort_order,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getChecklistTemplateLookup(
  phase: TrackerProjectRecord["phase"],
  itemKey: string,
): ChecklistTemplateLookup | null {
  const sections = trackerPhaseChecklistTemplates[phase] ?? [];

  for (const [sectionIndex, section] of sections.entries()) {
    const itemIndex = section.items.findIndex((item) => item.key === itemKey);
    if (itemIndex === -1) {
      continue;
    }

    const item = section.items[itemIndex];
    return {
      sectionKey: section.key,
      sectionTitle: section.title,
      label: item.label,
      description: item.description,
      sortOrder: sectionIndex * 100 + itemIndex,
    };
  }

  return null;
}

function mapReviewItemRow(row: ReviewItemRow): TrackerReviewItemRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    sourceArtifactId: row.source_artifact_id,
    action: row.action as TrackerReviewItemRecord["action"],
    status: row.status as TrackerReviewItemRecord["status"],
    confidence: row.confidence,
    reasoningSummary: row.reasoning_summary,
    proposalJson: row.proposal_json,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAuditLogRow(row: AuditLogRow): TrackerAuditLogRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    reviewItemId: row.review_item_id,
    entityKind: row.entity_kind,
    entityId: row.entity_id,
    action: row.action,
    actor: row.actor,
    payloadJson: row.payload_json,
    createdAt: row.created_at,
  };
}

async function ensureUniqueProjectSlug(
  db: D1Database,
  requestedSlug: string,
  excludeProjectId?: string,
) {
  let nextSlug = slugify(requestedSlug);
  let suffix = 1;

  while (true) {
    const existing = await queryFirst<{ id: string }>(
      db,
      "SELECT id FROM projects WHERE slug = ?",
      nextSlug,
    );

    if (!existing || existing.id === excludeProjectId) {
      return nextSlug;
    }

    suffix += 1;
    nextSlug = `${slugify(requestedSlug)}-${suffix}`;
  }
}

async function initializeTracker(db: D1Database) {
  await execSqlBatch(db, trackerMigrationSql);
}

export async function ensureTrackerReady(env: TrackerEnv) {
  const cached = readyByDb.get(env.DB);
  if (cached) {
    return cached;
  }

  const pending = initializeTracker(env.DB);
  readyByDb.set(env.DB, pending);
  await pending;
}

async function ensureProjectChecklistItems(
  db: D1Database,
  projectId: string,
  phase: TrackerProjectRecord["phase"],
) {
  const templateSections = trackerPhaseChecklistTemplates[phase] ?? [];
  if (templateSections.length === 0) {
    return;
  }

  const existingRows = await queryAll<Pick<ChecklistItemRow, "item_key">>(
    db,
    "SELECT item_key FROM project_checklist_items WHERE project_id = ? AND phase = ?",
    projectId,
    phase,
  );
  const existingKeys = new Set(existingRows.map((row) => row.item_key));

  const createdAt = nowIso();
  const statements = templateSections.flatMap((section, sectionIndex) =>
    section.items.flatMap((item, itemIndex) => {
      if (existingKeys.has(item.key)) {
        return [];
      }

      const sortOrder = sectionIndex * 100 + itemIndex;
      return [
        db
          .prepare(
            `INSERT OR IGNORE INTO project_checklist_items (
              id, project_id, phase, section_key, item_key, completed, sort_order,
              completed_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, 0, ?, NULL, ?, ?)`,
          )
          .bind(
            createId("check"),
            projectId,
            phase,
            section.key,
            item.key,
            sortOrder,
            createdAt,
            createdAt,
          ),
      ];
    }),
  );

  if (statements.length > 0) {
    await db.batch(statements);
  }
}

export async function getWorkspaceData(env: TrackerEnv): Promise<TrackerWorkspaceData> {
  await ensureTrackerReady(env);

  const projectRows = await queryAll<ProjectRow>(
    env.DB,
    "SELECT * FROM projects ORDER BY updated_at DESC, name ASC",
  );

  await Promise.all(
    projectRows.map((project) =>
      ensureProjectChecklistItems(env.DB, project.id, project.phase as TrackerProjectRecord["phase"]),
    ),
  );

  const [
    taskRows,
    taskSubtaskRows,
    decisionRows,
    artifactRows,
    checklistRows,
    customChecklistRows,
    hiddenChecklistRows,
    reviewItemRows,
  ] = await Promise.all([
    queryAll<TaskRow>(
      env.DB,
      "SELECT * FROM tasks ORDER BY status ASC, sort_order ASC, due_date ASC, created_at ASC",
    ),
    queryAll<TaskSubtaskRow>(
      env.DB,
      "SELECT * FROM task_subtasks ORDER BY task_id ASC, sort_order ASC, created_at ASC",
    ),
    queryAll<DecisionRow>(
      env.DB,
      "SELECT * FROM decisions ORDER BY decided_at DESC, created_at DESC",
    ),
    queryAll<ArtifactRow>(
      env.DB,
      "SELECT * FROM artifacts ORDER BY created_at DESC, updated_at DESC",
    ),
    queryAll<ChecklistItemRow>(
      env.DB,
      "SELECT * FROM project_checklist_items ORDER BY phase ASC, sort_order ASC, created_at ASC",
    ),
    queryAll<CustomChecklistItemRow>(
      env.DB,
      `SELECT * FROM project_checklist_custom_items
       ORDER BY phase ASC, section_key ASC, sort_order ASC, created_at ASC`,
    ),
    queryAll<HiddenChecklistItemRow>(
      env.DB,
      "SELECT project_id, phase, item_key FROM project_checklist_hidden_items",
    ),
    queryAll<ReviewItemRow>(
      env.DB,
      "SELECT * FROM review_items ORDER BY status ASC, created_at DESC",
    ),
  ]);

  const tasksByProject = new Map<string, TrackerTaskRecord[]>();
  const tasksById = new Map<string, TrackerTaskRecord>();
  const decisionsByProject = new Map<string, TrackerDecisionRecord[]>();
  const artifactsByProject = new Map<string, TrackerArtifactRecord[]>();
  const checklistItemsByProject = new Map<string, TrackerChecklistItemRecord[]>();
  const hiddenChecklistItemsByProject = new Map<
    string,
    TrackerHiddenChecklistItemRecord[]
  >();
  const projectPhaseById = new Map(
    projectRows.map((row) => [row.id, row.phase as TrackerProjectRecord["phase"]]),
  );
  const hiddenChecklistKeys = new Set(
    hiddenChecklistRows.map(
      (row) => `${row.project_id}:${row.phase}:${row.item_key}`,
    ),
  );

  for (const row of taskRows) {
    const mapped = mapTaskRow(row);
    const tasks = tasksByProject.get(mapped.projectId) ?? [];
    tasks.push(mapped);
    tasksByProject.set(mapped.projectId, tasks);
    tasksById.set(mapped.id, mapped);
  }

  for (const row of taskSubtaskRows) {
    const task = tasksById.get(row.task_id);
    if (!task) {
      continue;
    }

    task.subtasks.push(mapTaskSubtaskRow(row));
  }

  for (const row of decisionRows) {
    const mapped = mapDecisionRow(row);
    const decisions = decisionsByProject.get(mapped.projectId) ?? [];
    decisions.push(mapped);
    decisionsByProject.set(mapped.projectId, decisions);
  }

  for (const row of artifactRows) {
    const mapped = mapArtifactRow(row);
    const artifacts = artifactsByProject.get(mapped.projectId) ?? [];
    artifacts.push(mapped);
    artifactsByProject.set(mapped.projectId, artifacts);
  }

  for (const row of checklistRows) {
    const currentPhase = projectPhaseById.get(row.project_id);
    if (!currentPhase || row.phase !== currentPhase) {
      continue;
    }

    const hiddenKey = `${row.project_id}:${row.phase}:${row.item_key}`;
    if (hiddenChecklistKeys.has(hiddenKey)) {
      continue;
    }

    const mapped = mapChecklistItemRow(row);
    const items = checklistItemsByProject.get(mapped.projectId) ?? [];
    items.push(mapped);
    checklistItemsByProject.set(mapped.projectId, items);
  }

  for (const row of customChecklistRows) {
    const currentPhase = projectPhaseById.get(row.project_id);
    if (!currentPhase || row.phase !== currentPhase) {
      continue;
    }

    const mapped = mapCustomChecklistItemRow(row);
    const items = checklistItemsByProject.get(mapped.projectId) ?? [];
    items.push(mapped);
    checklistItemsByProject.set(mapped.projectId, items);
  }

  for (const row of hiddenChecklistRows) {
    const currentPhase = projectPhaseById.get(row.project_id);
    if (!currentPhase || row.phase !== currentPhase) {
      continue;
    }

    const lookup = getChecklistTemplateLookup(currentPhase, row.item_key);
    if (!lookup) {
      continue;
    }

    const items = hiddenChecklistItemsByProject.get(row.project_id) ?? [];
    items.push({
      projectId: row.project_id,
      phase: currentPhase,
      sectionKey: lookup.sectionKey,
      sectionTitle: lookup.sectionTitle,
      itemKey: row.item_key,
      label: lookup.label,
      description: lookup.description,
      sortOrder: lookup.sortOrder,
    });
    hiddenChecklistItemsByProject.set(row.project_id, items);
  }

  const projects: TrackerProjectDetail[] = projectRows.map((row) => {
    const project = mapProjectRow(row);
    const hiddenChecklistItems = [
      ...(hiddenChecklistItemsByProject.get(project.id) ?? []),
    ].sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }

      return a.label.localeCompare(b.label);
    });

    return {
      ...project,
      tasks: tasksByProject.get(project.id) ?? [],
      decisions: decisionsByProject.get(project.id) ?? [],
      artifacts: artifactsByProject.get(project.id) ?? [],
      checklistItems: checklistItemsByProject.get(project.id) ?? [],
      hiddenChecklistItems,
    };
  });

  return {
    generatedAt: nowIso(),
    projects,
    reviewItems: reviewItemRows.map(mapReviewItemRow),
  };
}

export async function getAuditLogs(env: TrackerEnv, projectId: string) {
  await ensureTrackerReady(env);
  const rows = await queryAll<AuditLogRow>(
    env.DB,
    "SELECT * FROM audit_logs WHERE project_id = ? ORDER BY created_at DESC",
    projectId,
  );

  return rows.map(mapAuditLogRow);
}

export async function getProjectById(env: TrackerEnv, projectId: string) {
  await ensureTrackerReady(env);
  const row = await queryFirst<ProjectRow>(
    env.DB,
    "SELECT * FROM projects WHERE id = ?",
    projectId,
  );

  return row ? mapProjectRow(row) : null;
}

async function getTaskByIdInternal(db: D1Database, taskId: string) {
  const row = await queryFirst<TaskRow>(db, "SELECT * FROM tasks WHERE id = ?", taskId);
  if (!row) {
    return null;
  }

  const task = mapTaskRow(row);
  const subtaskRows = await queryAll<TaskSubtaskRow>(
    db,
    "SELECT * FROM task_subtasks WHERE task_id = ? ORDER BY sort_order ASC, created_at ASC",
    taskId,
  );
  task.subtasks = subtaskRows.map(mapTaskSubtaskRow);
  return task;
}

async function getDecisionByIdInternal(db: D1Database, decisionId: string) {
  const row = await queryFirst<DecisionRow>(
    db,
    "SELECT * FROM decisions WHERE id = ?",
    decisionId,
  );
  return row ? mapDecisionRow(row) : null;
}

async function getProjectRowByIdInternal(db: D1Database, projectId: string) {
  return queryFirst<ProjectRow>(db, "SELECT * FROM projects WHERE id = ?", projectId);
}

async function getChecklistItemByIdInternal(
  db: D1Database,
  itemId: string,
): Promise<ChecklistItemLookup | null> {
  const row = await queryFirst<ChecklistItemRow>(
    db,
    "SELECT * FROM project_checklist_items WHERE id = ?",
    itemId,
  );
  if (row) {
    return {
      item: mapChecklistItemRow(row),
      source: "template",
    };
  }

  const customRow = await queryFirst<CustomChecklistItemRow>(
    db,
    "SELECT * FROM project_checklist_custom_items WHERE id = ?",
    itemId,
  );

  if (!customRow) {
    return null;
  }

  return {
    item: mapCustomChecklistItemRow(customRow),
    source: "custom",
  };
}

async function getNextChecklistSortOrder(
  db: D1Database,
  projectId: string,
  phase: TrackerProjectRecord["phase"],
  sectionKey: string,
) {
  const row = await queryFirst<{ max_sort_order: number | null }>(
    db,
    `SELECT MAX(sort_order) AS max_sort_order
     FROM (
       SELECT sort_order
       FROM project_checklist_items
       WHERE project_id = ? AND phase = ? AND section_key = ?
       UNION ALL
       SELECT sort_order
       FROM project_checklist_custom_items
       WHERE project_id = ? AND phase = ? AND section_key = ?
     )`,
    projectId,
    phase,
    sectionKey,
    projectId,
    phase,
    sectionKey,
  );

  return (row?.max_sort_order ?? -1) + 1;
}

async function getReviewItemByIdInternal(db: D1Database, reviewItemId: string) {
  const row = await queryFirst<ReviewItemRow>(
    db,
    "SELECT * FROM review_items WHERE id = ?",
    reviewItemId,
  );
  return row ? mapReviewItemRow(row) : null;
}

async function getNextSortOrder(
  db: D1Database,
  projectId: string,
  status: TrackerTaskRecord["status"],
) {
  const row = await queryFirst<{ next_sort_order: number | null }>(
    db,
    "SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_sort_order FROM tasks WHERE project_id = ? AND status = ?",
    projectId,
    status,
  );

  return row?.next_sort_order ?? 0;
}

async function replaceTaskSubtasks(
  db: D1Database,
  taskId: string,
  subtasks: NonNullable<TrackerTaskMutationInput["subtasks"]>,
  timestamp: string,
) {
  await runStatement(db, "DELETE FROM task_subtasks WHERE task_id = ?", taskId);

  const normalizedSubtasks = subtasks
    .map((subtask) => ({
      title: subtask.title.trim(),
      completed: subtask.completed === true,
    }))
    .filter((subtask) => subtask.title.length > 0);

  if (normalizedSubtasks.length === 0) {
    return;
  }

  const statements = normalizedSubtasks.map((subtask, index) =>
    db
      .prepare(
        `INSERT INTO task_subtasks (
          id, task_id, title, completed, sort_order, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        createId("subtask"),
        taskId,
        subtask.title,
        subtask.completed ? 1 : 0,
        index,
        timestamp,
        timestamp,
      ),
  );

  await db.batch(statements);
}

async function writeAuditLog(
  db: D1Database,
  projectId: string,
  action: string,
  actor: string,
  payload: unknown,
  options?: {
    entityKind?: string;
    entityId?: string | null;
    reviewItemId?: string | null;
  },
) {
  const createdAt = nowIso();
  await runStatement(
    db,
    `INSERT INTO audit_logs (
      id, project_id, review_item_id, entity_kind, entity_id, action, actor, payload_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    createId("audit"),
    projectId,
    options?.reviewItemId ?? null,
    options?.entityKind ?? "workspace",
    options?.entityId ?? null,
    action,
    actor,
    JSON.stringify(payload),
    createdAt,
  );
}

export async function createProject(
  env: TrackerEnv,
  input: TrackerProjectMutationInput,
) {
  await ensureTrackerReady(env);
  const parsed = projectMutationSchema.parse(input);
  const createdAt = input.createdAt ?? nowIso();
  const updatedAt = input.updatedAt ?? createdAt;
  const slug = await ensureUniqueProjectSlug(env.DB, input.slug ?? parsed.name);
  const projectId = createId("project");

  await runStatement(
    env.DB,
    `INSERT INTO projects (
      id, slug, code, name, client_name, project_type, location, phase, status,
      overview, next_milestone, owner_note, area, year, source_portal_slug, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    projectId,
    slug,
    input.code ?? "",
    parsed.name,
    input.clientName ?? "",
    input.projectType ?? "",
    input.location ?? "",
    parsed.phase,
    input.status ?? "active",
    input.overview ?? "",
    input.nextMilestone ?? "",
    input.ownerNote ?? "",
    input.area ?? "",
    input.year ?? "",
    input.sourcePortalSlug ?? null,
    createdAt,
    updatedAt,
  );

  await writeAuditLog(env.DB, projectId, "project.create", "system", input, {
    entityKind: "project",
    entityId: projectId,
  });

  await ensureProjectChecklistItems(env.DB, projectId, parsed.phase);

  const project = await getProjectById(env, projectId);
  if (!project) {
    throw new Error("Failed to create project");
  }

  return project;
}

export async function updateProject(
  env: TrackerEnv,
  projectId: string,
  patch: Partial<TrackerProjectMutationInput>,
) {
  await ensureTrackerReady(env);
  const existing = await getProjectById(env, projectId);
  if (!existing) {
    throw new Error("Project not found");
  }

  const merged: TrackerProjectMutationInput = {
    name: patch.name ?? existing.name,
    slug: patch.slug ?? existing.slug,
    clientName: patch.clientName ?? existing.clientName,
    code: patch.code ?? existing.code,
    projectType: patch.projectType ?? existing.projectType,
    location: patch.location ?? existing.location,
    phase: patch.phase ?? existing.phase,
    status: patch.status ?? existing.status,
    overview: patch.overview ?? existing.overview,
    nextMilestone: patch.nextMilestone ?? existing.nextMilestone,
    ownerNote: patch.ownerNote ?? existing.ownerNote,
    area: patch.area ?? existing.area,
    year: patch.year ?? existing.year,
    sourcePortalSlug: patch.sourcePortalSlug ?? existing.sourcePortalSlug,
  };

  const parsed = projectMutationSchema.parse(merged);
  const slug = await ensureUniqueProjectSlug(env.DB, merged.slug ?? parsed.name, projectId);
  const updatedAt = nowIso();

  await runStatement(
    env.DB,
    `UPDATE projects SET
      slug = ?, code = ?, name = ?, client_name = ?, project_type = ?, location = ?,
      phase = ?, status = ?, overview = ?, next_milestone = ?, owner_note = ?, area = ?,
      year = ?, source_portal_slug = ?, updated_at = ?
    WHERE id = ?`,
    slug,
    merged.code ?? "",
    parsed.name,
    merged.clientName ?? "",
    merged.projectType ?? "",
    merged.location ?? "",
    parsed.phase,
    merged.status ?? "active",
    merged.overview ?? "",
    merged.nextMilestone ?? "",
    merged.ownerNote ?? "",
    merged.area ?? "",
    merged.year ?? "",
    merged.sourcePortalSlug ?? null,
    updatedAt,
    projectId,
  );

  await writeAuditLog(env.DB, projectId, "project.update", "system", patch, {
    entityKind: "project",
    entityId: projectId,
  });

  await ensureProjectChecklistItems(env.DB, projectId, parsed.phase);

  const project = await getProjectById(env, projectId);
  if (!project) {
    throw new Error("Failed to update project");
  }

  return project;
}

export async function deleteProject(env: TrackerEnv, projectId: string) {
  await ensureTrackerReady(env);
  const existing = await getProjectById(env, projectId);
  if (!existing) {
    return false;
  }

  const artifactRows = await queryAll<{ file_path: string | null }>(
    env.DB,
    "SELECT file_path FROM artifacts WHERE project_id = ?",
    projectId,
  );
  const artifactPaths = Array.from(
    new Set(
      artifactRows.flatMap((row) => (row.file_path ? [row.file_path] : [])),
    ),
  );

  await env.DB.batch([
    env.DB.prepare("DELETE FROM audit_logs WHERE project_id = ?").bind(projectId),
    env.DB.prepare("DELETE FROM review_items WHERE project_id = ?").bind(projectId),
    env.DB.prepare("DELETE FROM tasks WHERE project_id = ?").bind(projectId),
    env.DB.prepare("DELETE FROM decisions WHERE project_id = ?").bind(projectId),
    env.DB.prepare("DELETE FROM artifacts WHERE project_id = ?").bind(projectId),
    env.DB.prepare("DELETE FROM projects WHERE id = ?").bind(projectId),
  ]);

  const cleanupResults = await Promise.allSettled(
    artifactPaths.map((objectKey) => env.ARTIFACTS_BUCKET.delete(objectKey)),
  );

  cleanupResults.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error("Failed to delete tracker artifact", artifactPaths[index], result.reason);
    }
  });

  return true;
}

export async function createTask(
  env: TrackerEnv,
  projectId: string,
  input: TrackerTaskMutationInput,
  options?: {
    createdFromReviewId?: string | null;
    actor?: string;
  },
) {
  await ensureTrackerReady(env);
  const parsed = taskMutationSchema.parse(input);
  const createdAt = nowIso();
  const sortOrder =
    parsed.sortOrder ?? (await getNextSortOrder(env.DB, projectId, parsed.status));
  const completedAt =
    parsed.status === "done" ? input.dueDate ?? createdAt : null;
  const taskId = createId("task");

  await runStatement(
    env.DB,
    `INSERT INTO tasks (
      id, project_id, phase, task_type, title, description, status, priority, assignee,
      due_date, location, revision, source_type, source_ref, source_artifact_id, next_action,
      blocker, human_verified, sort_order, created_from_review_id, created_at, updated_at, completed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    taskId,
    projectId,
    parsed.phase,
    parsed.taskType,
    parsed.title,
    parsed.description ?? "",
    parsed.status,
    parsed.priority,
    parsed.assignee ?? "",
    parsed.dueDate ?? null,
    parsed.location ?? "",
    parsed.revision ?? "",
    parsed.sourceType ?? "",
    parsed.sourceRef ?? "",
    parsed.sourceArtifactId ?? null,
    parsed.nextAction ?? "",
    parsed.blocker ?? "",
    parsed.humanVerified === false ? 0 : 1,
    sortOrder,
    options?.createdFromReviewId ?? null,
    createdAt,
    createdAt,
    completedAt,
  );

  await runStatement(
    env.DB,
    "UPDATE projects SET updated_at = ? WHERE id = ?",
    createdAt,
    projectId,
  );

  await replaceTaskSubtasks(env.DB, taskId, parsed.subtasks ?? [], createdAt);

  await writeAuditLog(
    env.DB,
    projectId,
    "task.create",
    options?.actor ?? "system",
    input,
    {
      entityKind: "task",
      entityId: taskId,
      reviewItemId: options?.createdFromReviewId ?? null,
    },
  );

  const task = await getTaskByIdInternal(env.DB, taskId);
  if (!task) {
    throw new Error("Failed to create task");
  }

  return task;
}

export async function updateTask(
  env: TrackerEnv,
  taskId: string,
  patch: Partial<TrackerTaskMutationInput>,
  options?: {
    actor?: string;
    reviewItemId?: string | null;
  },
) {
  await ensureTrackerReady(env);
  const existing = await getTaskByIdInternal(env.DB, taskId);
  if (!existing) {
    throw new Error("Task not found");
  }

  const merged: TrackerTaskMutationInput = {
    phase: patch.phase ?? existing.phase,
    taskType: patch.taskType ?? existing.taskType,
    title: patch.title ?? existing.title,
    description: patch.description ?? existing.description,
    status: patch.status ?? existing.status,
    priority: patch.priority ?? existing.priority,
    assignee: patch.assignee ?? existing.assignee,
    dueDate: patch.dueDate ?? existing.dueDate,
    location: patch.location ?? existing.location,
    revision: patch.revision ?? existing.revision,
    sourceType: patch.sourceType ?? existing.sourceType,
    sourceRef: patch.sourceRef ?? existing.sourceRef,
    sourceArtifactId: patch.sourceArtifactId ?? existing.sourceArtifactId,
    nextAction: patch.nextAction ?? existing.nextAction,
    blocker: patch.blocker ?? existing.blocker,
    humanVerified: patch.humanVerified ?? existing.humanVerified,
    sortOrder:
      patch.sortOrder ??
      (patch.status && patch.status !== existing.status
        ? await getNextSortOrder(env.DB, existing.projectId, patch.status)
        : existing.sortOrder),
    subtasks:
      patch.subtasks ??
      existing.subtasks.map((subtask) => ({
        title: subtask.title,
        completed: subtask.completed,
      })),
  };

  const parsed = taskMutationSchema.parse(merged);
  const updatedAt = nowIso();
  const completedAt =
    parsed.status === "done" ? existing.completedAt ?? updatedAt : null;

  await runStatement(
    env.DB,
    `UPDATE tasks SET
      phase = ?, task_type = ?, title = ?, description = ?, status = ?, priority = ?,
      assignee = ?, due_date = ?, location = ?, revision = ?, source_type = ?, source_ref = ?,
      source_artifact_id = ?, next_action = ?, blocker = ?, human_verified = ?, sort_order = ?,
      updated_at = ?, completed_at = ?
    WHERE id = ?`,
    parsed.phase,
    parsed.taskType,
    parsed.title,
    parsed.description ?? "",
    parsed.status,
    parsed.priority,
    parsed.assignee ?? "",
    parsed.dueDate ?? null,
    parsed.location ?? "",
    parsed.revision ?? "",
    parsed.sourceType ?? "",
    parsed.sourceRef ?? "",
    parsed.sourceArtifactId ?? null,
    parsed.nextAction ?? "",
    parsed.blocker ?? "",
    parsed.humanVerified === false ? 0 : 1,
    parsed.sortOrder ?? 0,
    updatedAt,
    completedAt,
    taskId,
  );

  await runStatement(
    env.DB,
    "UPDATE projects SET updated_at = ? WHERE id = ?",
    updatedAt,
    existing.projectId,
  );

  await replaceTaskSubtasks(env.DB, taskId, parsed.subtasks ?? [], updatedAt);

  await writeAuditLog(env.DB, existing.projectId, "task.update", options?.actor ?? "system", patch, {
    entityKind: "task",
    entityId: taskId,
    reviewItemId: options?.reviewItemId ?? null,
  });

  const updated = await getTaskByIdInternal(env.DB, taskId);
  if (!updated) {
    throw new Error("Failed to update task");
  }

  return updated;
}

export async function deleteTask(env: TrackerEnv, taskId: string) {
  await ensureTrackerReady(env);
  const existing = await getTaskByIdInternal(env.DB, taskId);
  if (!existing) {
    return false;
  }

  await runStatement(env.DB, "DELETE FROM tasks WHERE id = ?", taskId);
  await runStatement(
    env.DB,
    "UPDATE projects SET updated_at = ? WHERE id = ?",
    nowIso(),
    existing.projectId,
  );

  await writeAuditLog(env.DB, existing.projectId, "task.delete", "system", existing, {
    entityKind: "task",
    entityId: taskId,
  });

  return true;
}

export async function createChecklistItem(
  env: TrackerEnv,
  projectId: string,
  input: TrackerChecklistCreateInput,
  actor = "system",
) {
  await ensureTrackerReady(env);
  const parsed = checklistCreateSchema.parse(input);
  const projectRow = await getProjectRowByIdInternal(env.DB, projectId);

  if (!projectRow) {
    throw new Error("Project not found");
  }

  const templateSections =
    trackerPhaseChecklistTemplates[projectRow.phase as TrackerProjectRecord["phase"]] ?? [];
  const section = templateSections.find(
    (entry) => entry.key === parsed.sectionKey,
  );

  if (!section) {
    throw new Error("Checklist section not found");
  }

  const createdAt = nowIso();
  const itemId = createId("check");
  const sortOrder = await getNextChecklistSortOrder(
    env.DB,
    projectId,
    projectRow.phase as TrackerProjectRecord["phase"],
    parsed.sectionKey,
  );

  await runStatement(
    env.DB,
    `INSERT INTO project_checklist_custom_items (
      id, project_id, phase, section_key, label, description,
      completed, sort_order, completed_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, NULL, ?, ?)`,
    itemId,
    projectId,
    projectRow.phase,
    parsed.sectionKey,
    parsed.label,
    parsed.description ?? "",
    sortOrder,
    createdAt,
    createdAt,
  );

  await runStatement(
    env.DB,
    "UPDATE projects SET updated_at = ? WHERE id = ?",
    createdAt,
    projectId,
  );

  await writeAuditLog(
    env.DB,
    projectId,
    "checklist.create",
    actor,
    parsed,
    {
      entityKind: "checklist_item",
      entityId: itemId,
    },
  );

  const created = await getChecklistItemByIdInternal(env.DB, itemId);
  if (!created) {
    throw new Error("Failed to create checklist item");
  }

  return created.item;
}

export async function updateChecklistItem(
  env: TrackerEnv,
  projectId: string,
  input: TrackerChecklistMutationInput,
  actor = "system",
) {
  await ensureTrackerReady(env);
  const parsed = checklistMutationSchema.parse(input);
  const existing = await getChecklistItemByIdInternal(env.DB, parsed.itemId);

  if (!existing || existing.item.projectId !== projectId) {
    throw new Error("Checklist item not found");
  }

  const updatedAt = nowIso();
  const completedAt = parsed.completed
    ? existing.item.completedAt ?? updatedAt
    : null;
  const targetTable =
    existing.source === "custom"
      ? "project_checklist_custom_items"
      : "project_checklist_items";

  await runStatement(
    env.DB,
    `UPDATE ${targetTable}
     SET completed = ?, completed_at = ?, updated_at = ?
     WHERE id = ? AND project_id = ?`,
    parsed.completed ? 1 : 0,
    completedAt,
    updatedAt,
    parsed.itemId,
    projectId,
  );

  await runStatement(
    env.DB,
    "UPDATE projects SET updated_at = ? WHERE id = ?",
    updatedAt,
    projectId,
  );

  await writeAuditLog(
    env.DB,
    projectId,
    "checklist.update",
    actor,
    parsed,
    {
      entityKind: "checklist_item",
      entityId: parsed.itemId,
    },
  );

  const updated = await getChecklistItemByIdInternal(env.DB, parsed.itemId);
  if (!updated) {
    throw new Error("Failed to update checklist item");
  }

  return updated.item;
}

export async function removeChecklistItem(
  env: TrackerEnv,
  projectId: string,
  input: TrackerChecklistRemoveInput,
  actor = "system",
) {
  await ensureTrackerReady(env);
  const parsed = checklistRemoveSchema.parse(input);
  const existing = await getChecklistItemByIdInternal(env.DB, parsed.itemId);

  if (!existing || existing.item.projectId !== projectId) {
    throw new Error("Checklist item not found");
  }

  const updatedAt = nowIso();

  if (existing.source === "custom") {
    await runStatement(
      env.DB,
      "DELETE FROM project_checklist_custom_items WHERE id = ? AND project_id = ?",
      parsed.itemId,
      projectId,
    );
  } else {
    await runStatement(
      env.DB,
      `INSERT OR IGNORE INTO project_checklist_hidden_items (
        id, project_id, phase, item_key, created_at
      ) VALUES (?, ?, ?, ?, ?)`,
      createId("hide"),
      projectId,
      existing.item.phase,
      existing.item.itemKey,
      updatedAt,
    );
  }

  await runStatement(
    env.DB,
    "UPDATE projects SET updated_at = ? WHERE id = ?",
    updatedAt,
    projectId,
  );

  await writeAuditLog(
    env.DB,
    projectId,
    "checklist.remove",
    actor,
    {
      itemId: parsed.itemId,
      itemKey: existing.item.itemKey,
      isCustom: existing.item.isCustom,
      sectionKey: existing.item.sectionKey,
    },
    {
      entityKind: "checklist_item",
      entityId: parsed.itemId,
    },
  );

  return true;
}

export async function restoreHiddenChecklistItem(
  env: TrackerEnv,
  projectId: string,
  input: TrackerChecklistRestoreInput,
  actor = "system",
) {
  await ensureTrackerReady(env);
  const parsed = checklistRestoreSchema.parse(input);
  const projectRow = await getProjectRowByIdInternal(env.DB, projectId);

  if (!projectRow) {
    throw new Error("Project not found");
  }

  const lookup = getChecklistTemplateLookup(
    projectRow.phase as TrackerProjectRecord["phase"],
    parsed.itemKey,
  );
  if (!lookup) {
    throw new Error("Checklist item not found");
  }

  await runStatement(
    env.DB,
    `DELETE FROM project_checklist_hidden_items
     WHERE project_id = ? AND phase = ? AND item_key = ?`,
    projectId,
    projectRow.phase,
    parsed.itemKey,
  );

  const updatedAt = nowIso();
  await runStatement(
    env.DB,
    "UPDATE projects SET updated_at = ? WHERE id = ?",
    updatedAt,
    projectId,
  );

  await writeAuditLog(
    env.DB,
    projectId,
    "checklist.restore",
    actor,
    parsed,
    {
      entityKind: "checklist_item",
      entityId: parsed.itemKey,
    },
  );

  return true;
}

export async function reorderTasks(
  env: TrackerEnv,
  projectId: string,
  tasks: TrackerBoardMove[],
) {
  await ensureTrackerReady(env);
  const updatedAt = nowIso();
  const statements = tasks.map((item) =>
    env.DB
      .prepare(
        "UPDATE tasks SET status = ?, sort_order = ?, updated_at = ?, completed_at = ? WHERE id = ? AND project_id = ?",
      )
      .bind(
        item.status,
        item.sortOrder,
        updatedAt,
        item.status === "done" ? updatedAt : null,
        item.taskId,
        projectId,
      ),
  );

  if (statements.length > 0) {
    await env.DB.batch(statements);
  }

  await runStatement(
    env.DB,
    "UPDATE projects SET updated_at = ? WHERE id = ?",
    updatedAt,
    projectId,
  );

  await writeAuditLog(env.DB, projectId, "task.reorder", "system", tasks, {
    entityKind: "task",
  });

  return getWorkspaceData(env);
}

export async function createArtifact(
  env: TrackerEnv,
  input: TrackerArtifactMutationInput,
  options?: {
    actor?: string;
  },
) {
  await ensureTrackerReady(env);
  const createdAt = nowIso();
  const artifactId = createId("artifact");

  await runStatement(
    env.DB,
    `INSERT INTO artifacts (
      id, project_id, kind, title, file_name, file_path, mime_type, revision,
      extracted_summary, source_text, metadata_json, created_from_review_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    artifactId,
    input.projectId,
    input.kind,
    input.title,
    input.fileName ?? null,
    input.filePath ?? null,
    input.mimeType ?? null,
    input.revision ?? "",
    input.extractedSummary ?? "",
    input.sourceText ?? "",
    input.metadataJson ?? "{}",
    input.createdFromReviewId ?? null,
    createdAt,
    createdAt,
  );

  await runStatement(
    env.DB,
    "UPDATE projects SET updated_at = ? WHERE id = ?",
    createdAt,
    input.projectId,
  );

  await writeAuditLog(env.DB, input.projectId, "artifact.create", options?.actor ?? "system", input, {
    entityKind: "artifact",
    entityId: artifactId,
    reviewItemId: input.createdFromReviewId ?? null,
  });

  const row = await queryFirst<ArtifactRow>(
    env.DB,
    "SELECT * FROM artifacts WHERE id = ?",
    artifactId,
  );

  if (!row) {
    throw new Error("Failed to create artifact");
  }

  return mapArtifactRow(row);
}

export async function createDecision(
  env: TrackerEnv,
  projectId: string,
  input: TrackerDecisionMutationInput,
  options?: {
    actor?: string;
    createdFromReviewId?: string | null;
  },
) {
  await ensureTrackerReady(env);
  const decisionId = createId("decision");
  const createdAt = nowIso();

  await runStatement(
    env.DB,
    `INSERT INTO decisions (
      id, project_id, title, decision_text, decided_by, decided_at, source_artifact_id,
      created_from_review_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    decisionId,
    projectId,
    input.title,
    input.decisionText,
    input.decidedBy ?? "",
    input.decidedAt ?? createdAt,
    input.sourceArtifactId ?? null,
    options?.createdFromReviewId ?? null,
    createdAt,
    createdAt,
  );

  await runStatement(
    env.DB,
    "UPDATE projects SET updated_at = ? WHERE id = ?",
    createdAt,
    projectId,
  );

  await writeAuditLog(env.DB, projectId, "decision.create", options?.actor ?? "system", input, {
    entityKind: "decision",
    entityId: decisionId,
    reviewItemId: options?.createdFromReviewId ?? null,
  });

  const row = await queryFirst<DecisionRow>(
    env.DB,
    "SELECT * FROM decisions WHERE id = ?",
    decisionId,
  );

  if (!row) {
    throw new Error("Failed to create decision");
  }

  return mapDecisionRow(row);
}

export async function updateDecision(
  env: TrackerEnv,
  decisionId: string,
  patch: Partial<TrackerDecisionMutationInput>,
  options?: {
    actor?: string;
  },
) {
  await ensureTrackerReady(env);
  const existing = await getDecisionByIdInternal(env.DB, decisionId);
  if (!existing) {
    throw new Error("Decision not found");
  }

  const updatedAt = nowIso();
  const merged: TrackerDecisionMutationInput = {
    title: patch.title ?? existing.title,
    decisionText: patch.decisionText ?? existing.decisionText,
    decidedBy: patch.decidedBy ?? existing.decidedBy,
    decidedAt: patch.decidedAt ?? existing.decidedAt,
    sourceArtifactId:
      patch.sourceArtifactId === undefined ? existing.sourceArtifactId : patch.sourceArtifactId,
  };

  await runStatement(
    env.DB,
    `UPDATE decisions
     SET title = ?, decision_text = ?, decided_by = ?, decided_at = ?, source_artifact_id = ?, updated_at = ?
     WHERE id = ?`,
    merged.title,
    merged.decisionText,
    merged.decidedBy ?? "",
    merged.decidedAt ?? updatedAt,
    merged.sourceArtifactId ?? null,
    updatedAt,
    decisionId,
  );

  await runStatement(
    env.DB,
    "UPDATE projects SET updated_at = ? WHERE id = ?",
    updatedAt,
    existing.projectId,
  );

  await writeAuditLog(env.DB, existing.projectId, "decision.update", options?.actor ?? "system", merged, {
    entityKind: "decision",
    entityId: decisionId,
  });

  const updated = await getDecisionByIdInternal(env.DB, decisionId);
  if (!updated) {
    throw new Error("Failed to update decision");
  }

  return updated;
}

export async function deleteDecision(env: TrackerEnv, decisionId: string) {
  await ensureTrackerReady(env);
  const existing = await getDecisionByIdInternal(env.DB, decisionId);
  if (!existing) {
    return false;
  }

  const updatedAt = nowIso();
  await runStatement(env.DB, "DELETE FROM decisions WHERE id = ?", decisionId);
  await runStatement(
    env.DB,
    "UPDATE projects SET updated_at = ? WHERE id = ?",
    updatedAt,
    existing.projectId,
  );

  await writeAuditLog(env.DB, existing.projectId, "decision.delete", "system", existing, {
    entityKind: "decision",
    entityId: decisionId,
  });

  return true;
}

export async function createReviewItems(
  env: TrackerEnv,
  proposals: TrackerReviewProposal[],
) {
  await ensureTrackerReady(env);

  if (proposals.length === 0) {
    return [] satisfies TrackerReviewItemRecord[];
  }

  const createdAt = nowIso();
  const statements = proposals.map((proposal) =>
    env.DB
      .prepare(
        `INSERT INTO review_items (
          id, project_id, source_artifact_id, action, status, confidence, reasoning_summary,
          proposal_json, reviewed_by, reviewed_at, rejection_reason, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, NULL, NULL, NULL, ?, ?)`,
      )
      .bind(
        createId("review"),
        proposal.projectId,
        proposal.sourceArtifactId ?? null,
        proposal.action,
        proposal.confidence,
        proposal.reasoningSummary,
        JSON.stringify(proposal),
        createdAt,
        createdAt,
      ),
  );

  await env.DB.batch(statements);

  const reviewRows = await queryAll<ReviewItemRow>(
    env.DB,
    "SELECT * FROM review_items WHERE created_at = ? ORDER BY created_at DESC",
    createdAt,
  );

  return reviewRows.map(mapReviewItemRow);
}

export async function resolveReviewItemApproval(
  env: TrackerEnv,
  reviewItemId: string,
  reviewedBy = "BNJ Studio",
): Promise<TrackerReviewResolution> {
  await ensureTrackerReady(env);
  const reviewItem = await getReviewItemByIdInternal(env.DB, reviewItemId);
  if (!reviewItem) {
    throw new Error("Review item not found");
  }
  if (reviewItem.status !== "pending") {
    throw new Error("Review item has already been resolved");
  }

  const proposal = safeJsonParse<TrackerReviewProposal>(
    reviewItem.proposalJson,
    {} as TrackerReviewProposal,
  );

  if (!proposal.action) {
    throw new Error("Invalid review proposal payload");
  }

  if (proposal.action === "task.create") {
    await createTask(env, reviewItem.projectId, proposal.entity as TrackerTaskMutationInput, {
      actor: reviewedBy,
      createdFromReviewId: reviewItemId,
    });
  } else if (proposal.action === "task.update") {
    const entity = proposal.entity as {
      taskId: string;
      updates: Partial<TrackerTaskMutationInput>;
    };
    await updateTask(env, entity.taskId, entity.updates, {
      actor: reviewedBy,
      reviewItemId,
    });
  } else if (proposal.action === "decision.create") {
    await createDecision(
      env,
      reviewItem.projectId,
      proposal.entity as TrackerDecisionMutationInput,
      {
        actor: reviewedBy,
        createdFromReviewId: reviewItemId,
      },
    );
  } else if (proposal.action === "artifact.summary") {
    const entity = proposal.entity as {
      artifactId?: string;
      title?: string;
      kind?: TrackerArtifactRecord["kind"];
      extractedSummary: string;
      sourceText?: string;
      metadataJson?: string;
    };

    if (entity.artifactId) {
      await runStatement(
        env.DB,
        `UPDATE artifacts
         SET extracted_summary = ?, source_text = COALESCE(NULLIF(?, ''), source_text),
             metadata_json = COALESCE(NULLIF(?, ''), metadata_json), updated_at = ?
         WHERE id = ? AND project_id = ?`,
        entity.extractedSummary,
        entity.sourceText ?? "",
        entity.metadataJson ?? "",
        nowIso(),
        entity.artifactId,
        reviewItem.projectId,
      );
      await writeAuditLog(
        env.DB,
        reviewItem.projectId,
        "artifact.summary",
        reviewedBy,
        entity,
        {
          entityKind: "artifact",
          entityId: entity.artifactId,
          reviewItemId,
        },
      );
    } else {
      await createArtifact(
        env,
        {
          projectId: reviewItem.projectId,
          kind: entity.kind ?? "meeting_note",
          title: entity.title ?? "Artifact Summary",
          extractedSummary: entity.extractedSummary,
          sourceText: entity.sourceText ?? "",
          metadataJson: entity.metadataJson ?? "{}",
          createdFromReviewId: reviewItemId,
        },
        {
          actor: reviewedBy,
        },
      );
    }
  } else if (proposal.action === "report.weekly") {
    const entity = proposal.entity as {
      title?: string;
      extractedSummary: string;
      sourceText?: string;
      metadataJson?: string;
    };

    await createArtifact(
      env,
      {
        projectId: reviewItem.projectId,
        kind: "weekly_report",
        title: entity.title ?? "Weekly Report",
        extractedSummary: entity.extractedSummary,
        sourceText: entity.sourceText ?? entity.extractedSummary,
        metadataJson: entity.metadataJson ?? "{}",
        createdFromReviewId: reviewItemId,
      },
      {
        actor: reviewedBy,
      },
    );
  }

  const reviewedAt = nowIso();
  await runStatement(
    env.DB,
    `UPDATE review_items
     SET status = 'approved', reviewed_by = ?, reviewed_at = ?, updated_at = ?
     WHERE id = ?`,
    reviewedBy,
    reviewedAt,
    reviewedAt,
    reviewItemId,
  );

  await writeAuditLog(env.DB, reviewItem.projectId, "review.approve", reviewedBy, proposal, {
    entityKind: "review_item",
    entityId: reviewItemId,
    reviewItemId,
  });

  const updatedReviewItem = await getReviewItemByIdInternal(env.DB, reviewItemId);
  if (!updatedReviewItem) {
    throw new Error("Failed to reload approved review item");
  }

  return {
    reviewItem: updatedReviewItem,
    workspace: await getWorkspaceData(env),
  };
}

export async function resolveReviewItemRejection(
  env: TrackerEnv,
  reviewItemId: string,
  reason: string,
  reviewedBy = "BNJ Studio",
): Promise<TrackerReviewResolution> {
  await ensureTrackerReady(env);
  const reviewItem = await getReviewItemByIdInternal(env.DB, reviewItemId);
  if (!reviewItem) {
    throw new Error("Review item not found");
  }
  if (reviewItem.status !== "pending") {
    throw new Error("Review item has already been resolved");
  }

  const reviewedAt = nowIso();
  await runStatement(
    env.DB,
    `UPDATE review_items
     SET status = 'rejected', reviewed_by = ?, reviewed_at = ?, rejection_reason = ?, updated_at = ?
     WHERE id = ?`,
    reviewedBy,
    reviewedAt,
    reason,
    reviewedAt,
    reviewItemId,
  );

  await writeAuditLog(
    env.DB,
    reviewItem.projectId,
    "review.reject",
    reviewedBy,
    { reason },
    {
      entityKind: "review_item",
      entityId: reviewItemId,
      reviewItemId,
    },
  );

  const updatedReviewItem = await getReviewItemByIdInternal(env.DB, reviewItemId);
  if (!updatedReviewItem) {
    throw new Error("Failed to reload rejected review item");
  }

  return {
    reviewItem: updatedReviewItem,
    workspace: await getWorkspaceData(env),
  };
}

async function ensureLegacyInboxProject(env: TrackerEnv) {
  const existing = await queryFirst<ProjectRow>(
    env.DB,
    "SELECT * FROM projects WHERE slug = 'legacy-inbox'",
  );

  if (existing) {
    return mapProjectRow(existing);
  }

  return createProject(env, {
    name: "Legacy Inbox",
    slug: "legacy-inbox",
    code: "LEGACY",
    clientName: "BNJ Studio",
    projectType: "Internal",
    location: "Bangkok",
    phase: "concept",
    status: "active",
    overview: "Imported from legacy browser tracker data.",
    nextMilestone: "Review imported tasks",
    ownerNote: "One-time migration bucket for historical todos.",
    area: "",
    year: String(new Date().getFullYear()),
  });
}

export async function importLegacyTodos(
  env: TrackerEnv,
  items: TrackerLegacyTodoImport[],
) {
  await ensureTrackerReady(env);
  const workspace = await getWorkspaceData(env);
  const projectsBySlug = new Map(workspace.projects.map((project) => [project.slug, project]));
  const fallbackProject = await ensureLegacyInboxProject(env);

  for (const item of items) {
    const status =
      item.status === "completed"
        ? "done"
        : item.status === "in-progress"
          ? "doing"
          : item.status === "waiting"
            ? "waiting"
            : item.status === "blocked"
              ? "blocked"
              : "todo";

    const priority =
      item.priority === "high" || item.priority === "medium" || item.priority === "low"
        ? item.priority
        : "medium";

    const project = (item.projectSlug ? projectsBySlug.get(item.projectSlug) : null) ?? fallbackProject;

    await createTask(
      env,
      project.id,
      {
        phase: project.phase,
        taskType: "meeting_followup",
        title: item.title,
        description: item.description ?? "",
        status,
        priority,
        assignee: "BNJ Studio",
        dueDate: item.completedAt ?? item.createdAt ?? null,
        sourceType: "legacy.local_storage",
        sourceRef: item.id ?? "legacy",
        humanVerified: true,
      },
      {
        actor: "legacy-import",
      },
    );
  }

  return getWorkspaceData(env);
}

export async function answerWorkspaceQuery(
  env: TrackerEnv,
  question: string,
  projectId?: string,
): Promise<TrackerQueryResult> {
  await ensureTrackerReady(env);
  const workspace = await getWorkspaceData(env);
  const projects = projectId
    ? workspace.projects.filter((project) => project.id === projectId)
    : workspace.projects;

  const lower = question.toLowerCase();
  const snippets: string[] = [];

  for (const project of projects) {
    for (const task of project.tasks) {
      if (
        lower.includes("blocked")
          ? task.status === "blocked"
          : lower.includes("waiting")
            ? task.status === "waiting"
            : lower.includes("overdue")
              ? Boolean(task.dueDate && task.status !== "done" && new Date(task.dueDate) < new Date())
              : task.title.toLowerCase().includes(lower)
      ) {
        snippets.push(`${project.code} ${task.title} [${task.status}]`);
      }
    }
  }

  if (snippets.length === 0) {
    const openTasks = projects.flatMap((project) =>
      project.tasks
        .filter((task) => task.status !== "done")
        .slice(0, 5)
        .map((task) => `${project.code} ${task.title} [${task.status}]`),
    );

    return {
      answer:
        openTasks.length > 0
          ? `I could not match that exact request, but these open items are closest: ${openTasks.join("; ")}`
          : "No matching approved data was found in the tracker.",
      snippets: openTasks,
    };
  }

  return {
    answer: `Matched ${snippets.length} item(s): ${snippets.join("; ")}`,
    snippets,
  };
}

export function buildWeeklyReportProposal(
  project: TrackerProjectDetail,
): TrackerReviewProposal<"report.weekly", Record<string, unknown>> {
  const openTasks = project.tasks.filter((task) => task.status !== "done");
  const dueSoon = openTasks.filter((task) => {
    if (!task.dueDate) return false;
    const due = new Date(task.dueDate).getTime();
    const now = Date.now();
    return due >= now && due <= now + 7 * 24 * 60 * 60 * 1000;
  });
  const blocked = openTasks.filter((task) => task.status === "blocked");
  const waiting = openTasks.filter((task) => task.status === "waiting");
  const summary = [
    `${project.name} weekly report`,
    `Open tasks: ${openTasks.length}`,
    `Due within 7 days: ${dueSoon.length}`,
    `Blocked: ${blocked.length}`,
    `Waiting on: ${waiting.length}`,
  ].join("\n");

  return {
    version: "v1",
    action: "report.weekly",
    projectId: project.id,
    sourceArtifactId: null,
    confidence: 0.7,
    reasoningSummary: "Generated from approved tasks and current project state.",
    entity: {
      title: `${project.name} Weekly Report`,
      extractedSummary: summary,
      sourceText: summary,
      metadataJson: JSON.stringify({
        openTaskIds: openTasks.map((task) => task.id),
      }),
    },
  };
}

export function getProjectFromWorkspace(
  workspace: TrackerWorkspaceData,
  projectId: string,
) {
  return workspace.projects.find((project) => project.id === projectId) ?? null;
}

export function parseReviewProposal(reviewItem: TrackerReviewItemRecord) {
  return safeJsonParse<TrackerReviewProposal>(
    reviewItem.proposalJson,
    {} as TrackerReviewProposal,
  );
}

export function getArtifactMetadata(artifact: TrackerArtifactRecord) {
  return safeJsonParse<Record<string, unknown>>(artifact.metadataJson, {});
}

export function emptyGenerationResult(
  artifact: TrackerArtifactRecord,
): TrackerAiGenerationResult {
  return {
    artifact,
    reviewItems: [],
    provider: "heuristic",
  };
}
