CREATE TABLE IF NOT EXISTS gtd_items (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  bucket TEXT NOT NULL,
  context TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date TEXT,
  note TEXT NOT NULL DEFAULT '',
  done INTEGER NOT NULL DEFAULT 0,
  done_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS gtd_weekly_review (
  id TEXT PRIMARY KEY,
  steps_json TEXT NOT NULL DEFAULT '{}',
  focus TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  last_completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gtd_items_bucket_done ON gtd_items(bucket, done, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_gtd_items_due_date ON gtd_items(due_date);
