import type { D1Database } from "@cloudflare/workers-types";

import type { TrackerEnv } from "@/lib/tracker/env";
import { clientRoomCreateSchema, clientRoomDraftSchema, normalizeClientRoomDraft } from "@/lib/client-rooms/schemas";
import { clientRoomMigrationSql } from "@/lib/client-rooms/sql";
import {
  buildClientRoomAssetUrl,
  createEmptyClientRoomDraft,
  type ClientRoomAssetKind,
  type ClientRoomAssetRecord,
  type ClientRoomDraftData,
  type ClientRoomProjectRecord,
  type ClientRoomProjectSummary,
} from "@/lib/client-rooms/types";

type SqlPrimitive = string | number | null;

interface ClientRoomProjectRow {
  id: string;
  slug: string;
  title: string;
  client_name: string;
  share_token: string | null;
  draft_json: string;
  published_json: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

interface ClientRoomAssetRow {
  id: string;
  project_id: string;
  kind: string;
  file_name: string;
  object_key: string;
  mime_type: string;
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
    .slice(0, 60);

  return base || `client-room-${crypto.randomUUID().slice(0, 8)}`;
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]+/g, "-");
}

function buildClientRoomObjectKey(projectId: string, fileName: string) {
  return `client-rooms/${projectId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${sanitizeFileName(fileName)}`;
}

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
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

function normalizeDraftData(input: unknown): ClientRoomDraftData {
  const parsed = clientRoomDraftSchema.parse(input);
  return normalizeClientRoomDraft(parsed);
}

function getDocumentCount(draft: ClientRoomDraftData) {
  return draft.sections.reduce((count, section) => count + section.items.length, 0);
}

function mapProjectRow(row: ClientRoomProjectRow): ClientRoomProjectRecord {
  const fallbackDraft = createEmptyClientRoomDraft({
    title: row.title,
    clientName: row.client_name,
    slug: row.slug,
  });

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    clientName: row.client_name,
    shareToken: row.share_token,
    draftData: normalizeDraftData(safeJsonParse(row.draft_json, fallbackDraft)),
    publishedData: row.published_json
      ? normalizeDraftData(safeJsonParse(row.published_json, fallbackDraft))
      : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
  };
}

function mapAssetRow(row: ClientRoomAssetRow): ClientRoomAssetRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    kind: row.kind as ClientRoomAssetKind,
    fileName: row.file_name,
    objectKey: row.object_key,
    mimeType: row.mime_type,
    createdAt: row.created_at,
  };
}

async function ensureUniqueProjectSlug(
  db: D1Database,
  requestedSlug: string,
  excludeProjectId?: string,
) {
  const base = slugify(requestedSlug);
  let nextSlug = base;
  let suffix = 1;

  while (true) {
    const existing = await queryFirst<{ id: string }>(
      db,
      "SELECT id FROM client_room_projects WHERE slug = ?",
      nextSlug,
    );

    if (!existing || existing.id === excludeProjectId) {
      return nextSlug;
    }

    suffix += 1;
    nextSlug = `${base}-${suffix}`;
  }
}

async function initializeClientRooms(db: D1Database) {
  await execSqlBatch(db, clientRoomMigrationSql);
}

export async function ensureClientRoomsReady(env: TrackerEnv) {
  const cached = readyByDb.get(env.DB);
  if (cached) {
    return cached;
  }

  const pending = initializeClientRooms(env.DB);
  readyByDb.set(env.DB, pending);
  await pending;
}

export async function listClientRoomProjects(
  env: TrackerEnv,
): Promise<ClientRoomProjectSummary[]> {
  await ensureClientRoomsReady(env);
  const rows = await queryAll<ClientRoomProjectRow>(
    env.DB,
    `SELECT *
     FROM client_room_projects
     ORDER BY COALESCE(published_at, updated_at) DESC, updated_at DESC, title ASC`,
  );

  return rows.map((row) => {
    const fallbackDraft = createEmptyClientRoomDraft({
      title: row.title,
      clientName: row.client_name,
      slug: row.slug,
    });
    const draft = normalizeDraftData(safeJsonParse(row.draft_json, fallbackDraft));

    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      clientName: row.client_name,
      projectType: draft.projectType,
      location: draft.location,
      year: draft.year,
      overview: draft.overview,
      documentCount: getDocumentCount(draft),
      shareToken: row.share_token,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      publishedAt: row.published_at,
    };
  });
}

export async function getClientRoomProjectById(
  env: TrackerEnv,
  projectId: string,
) {
  await ensureClientRoomsReady(env);
  const row = await queryFirst<ClientRoomProjectRow>(
    env.DB,
    "SELECT * FROM client_room_projects WHERE id = ?",
    projectId,
  );

  return row ? mapProjectRow(row) : null;
}

export async function createClientRoomProject(
  env: TrackerEnv,
  input: unknown,
) {
  await ensureClientRoomsReady(env);
  const parsed = clientRoomCreateSchema.parse(input);
  const draft = createEmptyClientRoomDraft({
    title: parsed.title,
    slug: slugify(parsed.title),
  });
  const slug = await ensureUniqueProjectSlug(env.DB, draft.slug);
  const draftWithSlug = {
    ...draft,
    slug,
  };
  const createdAt = nowIso();
  const projectId = createId("client_room");

  await runStatement(
    env.DB,
    `INSERT INTO client_room_projects (
      id, slug, title, client_name, share_token, draft_json, published_json,
      created_at, updated_at, published_at
    ) VALUES (?, ?, ?, ?, NULL, ?, NULL, ?, ?, NULL)`,
    projectId,
    slug,
    draftWithSlug.title,
    draftWithSlug.clientName,
    JSON.stringify(draftWithSlug),
    createdAt,
    createdAt,
  );

  const project = await getClientRoomProjectById(env, projectId);
  if (!project) {
    throw new Error("Failed to create client room");
  }

  return project;
}

export async function saveClientRoomProject(
  env: TrackerEnv,
  projectId: string,
  draftInput: unknown,
) {
  await ensureClientRoomsReady(env);
  const existing = await getClientRoomProjectById(env, projectId);
  if (!existing) {
    throw new Error("Client room not found");
  }

  const draft = normalizeDraftData(draftInput);
  const slug = await ensureUniqueProjectSlug(
    env.DB,
    draft.slug || draft.title,
    projectId,
  );
  const normalizedDraft: ClientRoomDraftData = {
    ...draft,
    slug,
  };
  const updatedAt = nowIso();

  await runStatement(
    env.DB,
    `UPDATE client_room_projects
     SET slug = ?, title = ?, client_name = ?, draft_json = ?, updated_at = ?
     WHERE id = ?`,
    slug,
    normalizedDraft.title,
    normalizedDraft.clientName,
    JSON.stringify(normalizedDraft),
    updatedAt,
    projectId,
  );

  const project = await getClientRoomProjectById(env, projectId);
  if (!project) {
    throw new Error("Failed to reload client room");
  }

  return project;
}

export async function publishClientRoomProject(
  env: TrackerEnv,
  projectId: string,
) {
  await ensureClientRoomsReady(env);
  const existing = await getClientRoomProjectById(env, projectId);
  if (!existing) {
    throw new Error("Client room not found");
  }

  const shareToken =
    existing.shareToken ??
    `${existing.slug}-${crypto.randomUUID().slice(0, 8)}`;
  const publishedAt = nowIso();

  await runStatement(
    env.DB,
    `UPDATE client_room_projects
     SET share_token = ?, published_json = ?, published_at = ?, updated_at = ?
     WHERE id = ?`,
    shareToken,
    JSON.stringify(existing.draftData),
    publishedAt,
    publishedAt,
    projectId,
  );

  const project = await getClientRoomProjectById(env, projectId);
  if (!project) {
    throw new Error("Failed to reload published client room");
  }

  return project;
}

export async function deleteClientRoomProject(
  env: TrackerEnv,
  projectId: string,
) {
  await ensureClientRoomsReady(env);
  const existing = await getClientRoomProjectById(env, projectId);
  if (!existing) {
    return false;
  }

  const assetRows = await queryAll<{ object_key: string }>(
    env.DB,
    "SELECT object_key FROM client_room_assets WHERE project_id = ?",
    projectId,
  );
  const objectKeys = Array.from(new Set(assetRows.map((row) => row.object_key)));

  await env.DB.batch([
    env.DB.prepare("DELETE FROM client_room_assets WHERE project_id = ?").bind(projectId),
    env.DB.prepare("DELETE FROM client_room_projects WHERE id = ?").bind(projectId),
  ]);

  const cleanupResults = await Promise.allSettled(
    objectKeys.map((objectKey) => env.ARTIFACTS_BUCKET.delete(objectKey)),
  );

  cleanupResults.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(
        "Failed to delete client room asset",
        objectKeys[index],
        result.reason,
      );
    }
  });

  return true;
}

export async function getPublishedClientRoomByShareToken(
  env: TrackerEnv,
  shareToken: string,
) {
  await ensureClientRoomsReady(env);
  const row = await queryFirst<ClientRoomProjectRow>(
    env.DB,
    `SELECT *
     FROM client_room_projects
     WHERE share_token = ? AND published_json IS NOT NULL`,
    shareToken,
  );

  return row ? mapProjectRow(row) : null;
}

export async function createClientRoomAsset(
  env: TrackerEnv,
  input: {
    projectId: string;
    kind: ClientRoomAssetKind;
    fileName: string;
    mimeType: string;
    bytes: ArrayBuffer;
  },
) {
  await ensureClientRoomsReady(env);
  await assertClientRoomExists(env, input.projectId);
  const objectKey = createClientRoomObjectKey(input.projectId, input.fileName);

  await env.ARTIFACTS_BUCKET.put(objectKey, input.bytes, {
    httpMetadata: {
      contentType: input.mimeType,
    },
  });

  return createClientRoomAssetRecord(env, {
    projectId: input.projectId,
    kind: input.kind,
    fileName: input.fileName,
    mimeType: input.mimeType,
    objectKey,
  });
}

export async function assertClientRoomExists(env: TrackerEnv, projectId: string) {
  const existing = await getClientRoomProjectById(env, projectId);
  if (!existing) {
    throw new Error("Client room not found");
  }

  return existing;
}

export function createClientRoomObjectKey(projectId: string, fileName: string) {
  return buildClientRoomObjectKey(projectId, fileName);
}

export async function createClientRoomAssetRecord(
  env: TrackerEnv,
  input: {
    projectId: string;
    kind: ClientRoomAssetKind;
    fileName: string;
    mimeType: string;
    objectKey: string;
  },
) {
  await ensureClientRoomsReady(env);
  await assertClientRoomExists(env, input.projectId);

  const assetId = createId("client_room_asset");
  const createdAt = nowIso();

  await runStatement(
    env.DB,
    `INSERT INTO client_room_assets (
      id, project_id, kind, file_name, object_key, mime_type, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    assetId,
    input.projectId,
    input.kind,
    input.fileName,
    input.objectKey,
    input.mimeType,
    createdAt,
  );

  const row = await queryFirst<ClientRoomAssetRow>(
    env.DB,
    "SELECT * FROM client_room_assets WHERE id = ?",
    assetId,
  );

  if (!row) {
    throw new Error("Failed to create asset");
  }

  return {
    asset: mapAssetRow(row),
    url: buildClientRoomAssetUrl(assetId),
  };
}

export async function getClientRoomAssetById(
  env: TrackerEnv,
  assetId: string,
) {
  await ensureClientRoomsReady(env);
  const row = await queryFirst<ClientRoomAssetRow>(
    env.DB,
    "SELECT * FROM client_room_assets WHERE id = ?",
    assetId,
  );

  return row ? mapAssetRow(row) : null;
}
