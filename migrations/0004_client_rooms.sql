CREATE TABLE IF NOT EXISTS client_room_projects (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  client_name TEXT NOT NULL DEFAULT '',
  share_token TEXT UNIQUE,
  draft_json TEXT NOT NULL,
  published_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  published_at TEXT
);

CREATE TABLE IF NOT EXISTS client_room_assets (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  file_name TEXT NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES client_room_projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_client_room_projects_updated
  ON client_room_projects(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_client_room_projects_published
  ON client_room_projects(published_at DESC);

CREATE INDEX IF NOT EXISTS idx_client_room_assets_project
  ON client_room_assets(project_id, created_at DESC);
