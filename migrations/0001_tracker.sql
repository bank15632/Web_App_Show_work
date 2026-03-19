CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  project_type TEXT NOT NULL,
  location TEXT NOT NULL,
  phase TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  overview TEXT NOT NULL DEFAULT '',
  next_milestone TEXT NOT NULL DEFAULT '',
  owner_note TEXT NOT NULL DEFAULT '',
  area TEXT NOT NULL DEFAULT '',
  year TEXT NOT NULL DEFAULT '',
  source_portal_slug TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS artifacts (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  file_name TEXT,
  file_path TEXT,
  mime_type TEXT,
  revision TEXT NOT NULL DEFAULT '',
  extracted_summary TEXT NOT NULL DEFAULT '',
  source_text TEXT NOT NULL DEFAULT '',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_from_review_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  phase TEXT NOT NULL,
  task_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  assignee TEXT NOT NULL DEFAULT '',
  due_date TEXT,
  location TEXT NOT NULL DEFAULT '',
  revision TEXT NOT NULL DEFAULT '',
  source_type TEXT NOT NULL DEFAULT '',
  source_ref TEXT NOT NULL DEFAULT '',
  source_artifact_id TEXT,
  next_action TEXT NOT NULL DEFAULT '',
  blocker TEXT NOT NULL DEFAULT '',
  human_verified INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_from_review_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (source_artifact_id) REFERENCES artifacts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS decisions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  decision_text TEXT NOT NULL,
  decided_by TEXT NOT NULL DEFAULT '',
  decided_at TEXT NOT NULL,
  source_artifact_id TEXT,
  created_from_review_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (source_artifact_id) REFERENCES artifacts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS review_items (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  source_artifact_id TEXT,
  action TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  confidence REAL NOT NULL DEFAULT 0,
  reasoning_summary TEXT NOT NULL DEFAULT '',
  proposal_json TEXT NOT NULL,
  reviewed_by TEXT,
  reviewed_at TEXT,
  rejection_reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (source_artifact_id) REFERENCES artifacts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  review_item_id TEXT,
  entity_kind TEXT NOT NULL,
  entity_id TEXT,
  action TEXT NOT NULL,
  actor TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (review_item_id) REFERENCES review_items(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON tasks(project_id, status, sort_order);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(project_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(project_id, task_type);
CREATE INDEX IF NOT EXISTS idx_decisions_project ON decisions(project_id, decided_at DESC);
CREATE INDEX IF NOT EXISTS idx_artifacts_project_kind ON artifacts(project_id, kind, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_items_status ON review_items(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_items_project ON review_items(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_project ON audit_logs(project_id, created_at DESC);
