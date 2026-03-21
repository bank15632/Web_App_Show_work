import type { D1Database } from "@cloudflare/workers-types";

import { gtdMigrationSql } from "@/lib/gtd/sql";
import {
  createDefaultReviewState,
  type GtdItem,
  type GtdItemMutationInput,
  type GtdReviewMutationInput,
  type GtdWorkspaceData,
  type WeeklyReviewState,
} from "@/lib/gtd-system";
import type { TrackerEnv } from "@/lib/tracker/env";

type SqlPrimitive = string | number | null;

interface GtdItemRow {
  id: string;
  text: string;
  bucket: string;
  context: string;
  priority: string;
  due_date: string | null;
  note: string;
  linked_project_id: string | null;
  linked_task_id: string | null;
  done: number;
  done_at: string | null;
  created_at: string;
  updated_at: string;
}

interface GtdWeeklyReviewRow {
  id: string;
  steps_json: string;
  focus: string;
  notes: string;
  last_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

const readyByDb = new WeakMap<D1Database, Promise<void>>();
const reviewRowId = "singleton";

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
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

function safeParseReviewSteps(value: string) {
  try {
    const parsed = JSON.parse(value) as WeeklyReviewState["steps"];
    return {
      ...createDefaultReviewState().steps,
      ...(parsed ?? {}),
    };
  } catch {
    return createDefaultReviewState().steps;
  }
}

function mapItemRow(row: GtdItemRow): GtdItem {
  return {
    id: row.id,
    text: row.text,
    bucket: row.bucket as GtdItem["bucket"],
    context: row.context as GtdItem["context"],
    priority: row.priority as GtdItem["priority"],
    dueDate: row.due_date,
    note: row.note,
    linkedProjectId: row.linked_project_id,
    linkedTaskId: row.linked_task_id,
    done: row.done === 1,
    doneAt: row.done_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapReviewRow(row: GtdWeeklyReviewRow): WeeklyReviewState {
  return {
    steps: safeParseReviewSteps(row.steps_json),
    focus: row.focus,
    notes: row.notes,
    lastCompletedAt: row.last_completed_at,
  };
}

async function ensureReviewRow(db: D1Database) {
  const existing = await queryFirst<{ id: string }>(
    db,
    "SELECT id FROM gtd_weekly_review WHERE id = ?",
    reviewRowId,
  );

  if (existing) return;

  const now = nowIso();
  const review = createDefaultReviewState();

  await runStatement(
    db,
    `INSERT INTO gtd_weekly_review (
      id, steps_json, focus, notes, last_completed_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    reviewRowId,
    JSON.stringify(review.steps),
    review.focus,
    review.notes,
    review.lastCompletedAt,
    now,
    now,
  );
}

async function initializeGtd(db: D1Database) {
  await execSqlBatch(db, gtdMigrationSql);
  await ensureReviewRow(db);
}

export async function ensureGtdReady(env: TrackerEnv) {
  const cached = readyByDb.get(env.DB);
  if (cached) {
    return cached;
  }

  const pending = initializeGtd(env.DB);
  readyByDb.set(env.DB, pending);
  await pending;
}

export async function getGtdWorkspaceData(
  env: TrackerEnv,
): Promise<GtdWorkspaceData> {
  await ensureGtdReady(env);

  const [itemRows, reviewRow] = await Promise.all([
    queryAll<GtdItemRow>(
      env.DB,
      "SELECT * FROM gtd_items ORDER BY done ASC, updated_at DESC, created_at DESC",
    ),
    queryFirst<GtdWeeklyReviewRow>(
      env.DB,
      "SELECT * FROM gtd_weekly_review WHERE id = ?",
      reviewRowId,
    ),
  ]);

  return {
    items: itemRows.map(mapItemRow),
    review: reviewRow ? mapReviewRow(reviewRow) : createDefaultReviewState(),
  };
}

export async function createGtdItem(
  env: TrackerEnv,
  input: GtdItemMutationInput,
) {
  await ensureGtdReady(env);

  const now = nowIso();
  const item: GtdItem = {
    id: createId("gtd"),
    text: input.text,
    bucket: input.bucket ?? "inbox",
    context: input.context ?? "",
    priority: input.priority ?? "medium",
    dueDate: input.dueDate ?? null,
    note: input.note ?? "",
    linkedProjectId: input.linkedProjectId ?? null,
    linkedTaskId: input.linkedTaskId ?? null,
    done: input.done ?? false,
    doneAt: input.done ? input.doneAt ?? now : null,
    createdAt: now,
    updatedAt: now,
  };

  await runStatement(
    env.DB,
    `INSERT INTO gtd_items (
      id, text, bucket, context, priority, due_date, note, linked_project_id, linked_task_id,
      done, done_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    item.id,
    item.text,
    item.bucket,
    item.context,
    item.priority,
    item.dueDate,
    item.note,
    item.linkedProjectId,
    item.linkedTaskId,
    item.done ? 1 : 0,
    item.doneAt,
    item.createdAt,
    item.updatedAt,
  );

  return item;
}

export async function updateGtdItem(
  env: TrackerEnv,
  itemId: string,
  patch: Partial<GtdItemMutationInput>,
) {
  await ensureGtdReady(env);

  const existing = await queryFirst<GtdItemRow>(
    env.DB,
    "SELECT * FROM gtd_items WHERE id = ?",
    itemId,
  );

  if (!existing) {
    throw new Error("GTD item not found.");
  }

  const mapped = mapItemRow(existing);
  const now = nowIso();
  const done = patch.done ?? mapped.done;
  const nextDoneAt =
    patch.done !== undefined
      ? done
        ? patch.doneAt ?? mapped.doneAt ?? now
        : null
      : patch.doneAt !== undefined
        ? patch.doneAt
        : mapped.doneAt;

  const nextItem: GtdItem = {
    ...mapped,
    text: patch.text ?? mapped.text,
    bucket: patch.bucket ?? mapped.bucket,
    context: patch.context ?? mapped.context,
    priority: patch.priority ?? mapped.priority,
    dueDate: patch.dueDate !== undefined ? patch.dueDate : mapped.dueDate,
    note: patch.note ?? mapped.note,
    linkedProjectId:
      patch.linkedProjectId !== undefined ? patch.linkedProjectId : mapped.linkedProjectId,
    linkedTaskId:
      patch.linkedTaskId !== undefined ? patch.linkedTaskId : mapped.linkedTaskId,
    done,
    doneAt: nextDoneAt,
    updatedAt: now,
  };

  await runStatement(
    env.DB,
    `UPDATE gtd_items
      SET text = ?, bucket = ?, context = ?, priority = ?, due_date = ?, note = ?,
          linked_project_id = ?, linked_task_id = ?, done = ?, done_at = ?, updated_at = ?
      WHERE id = ?`,
    nextItem.text,
    nextItem.bucket,
    nextItem.context,
    nextItem.priority,
    nextItem.dueDate,
    nextItem.note,
    nextItem.linkedProjectId,
    nextItem.linkedTaskId,
    nextItem.done ? 1 : 0,
    nextItem.doneAt,
    nextItem.updatedAt,
    itemId,
  );

  return nextItem;
}

export async function deleteGtdItem(env: TrackerEnv, itemId: string) {
  await ensureGtdReady(env);

  const existing = await queryFirst<{ id: string }>(
    env.DB,
    "SELECT id FROM gtd_items WHERE id = ?",
    itemId,
  );

  if (!existing) {
    throw new Error("GTD item not found.");
  }

  await runStatement(env.DB, "DELETE FROM gtd_items WHERE id = ?", itemId);
  return { id: itemId };
}

export async function updateGtdReview(
  env: TrackerEnv,
  patch: GtdReviewMutationInput,
) {
  await ensureGtdReady(env);

  const existing = await queryFirst<GtdWeeklyReviewRow>(
    env.DB,
    "SELECT * FROM gtd_weekly_review WHERE id = ?",
    reviewRowId,
  );

  const current = existing ? mapReviewRow(existing) : createDefaultReviewState();
  const nextReview = patch.reset
    ? createDefaultReviewState()
    : {
        ...current,
        steps: {
          ...current.steps,
          ...(patch.steps ?? {}),
        },
        focus: patch.focus ?? current.focus,
        notes: patch.notes ?? current.notes,
        lastCompletedAt:
          patch.lastCompletedAt !== undefined
            ? patch.lastCompletedAt
            : current.lastCompletedAt,
      };

  const now = nowIso();

  await runStatement(
    env.DB,
    `UPDATE gtd_weekly_review
      SET steps_json = ?, focus = ?, notes = ?, last_completed_at = ?, updated_at = ?
      WHERE id = ?`,
    JSON.stringify(nextReview.steps),
    nextReview.focus,
    nextReview.notes,
    nextReview.lastCompletedAt,
    now,
    reviewRowId,
  );

  return nextReview;
}
