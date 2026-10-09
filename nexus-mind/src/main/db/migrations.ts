/**
 * Ordered, append-only schema migrations. Never edit a shipped migration;
 * add a new one. The runner tracks progress in `PRAGMA user_version`.
 */
export interface Migration {
  version: number;
  name: string;
  sql: string;
}

export const MIGRATIONS: readonly Migration[] = [
  {
    version: 1,
    name: 'core-schema',
    sql: /* sql */ `
      CREATE TABLE kv (
        key        TEXT PRIMARY KEY,
        value      TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
      );

      CREATE TABLE secrets (
        provider   TEXT PRIMARY KEY,
        cipher     BLOB NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
      );

      CREATE TABLE projects (
        id         TEXT PRIMARY KEY,
        name       TEXT NOT NULL,
        color      TEXT NOT NULL,
        icon       TEXT NOT NULL DEFAULT 'folder',
        archived   INTEGER NOT NULL DEFAULT 0,
        sort_order REAL NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE tasks (
        id               TEXT PRIMARY KEY,
        project_id       TEXT REFERENCES projects(id) ON DELETE SET NULL,
        parent_id        TEXT REFERENCES tasks(id) ON DELETE CASCADE,
        title            TEXT NOT NULL,
        description      TEXT NOT NULL DEFAULT '',
        status           TEXT NOT NULL DEFAULT 'inbox'
                         CHECK (status IN ('inbox','todo','in_progress','done','archived')),
        priority         INTEGER NOT NULL DEFAULT 0 CHECK (priority BETWEEN 0 AND 3),
        urgent           INTEGER NOT NULL DEFAULT 0,
        important        INTEGER NOT NULL DEFAULT 0,
        due_at           TEXT,
        scheduled_start  TEXT,
        estimate_minutes INTEGER,
        recurrence       TEXT,
        tags             TEXT NOT NULL DEFAULT '[]',
        sort_order       REAL NOT NULL DEFAULT 0,
        completed_at     TEXT,
        created_at       TEXT NOT NULL,
        updated_at       TEXT NOT NULL
      );
      CREATE INDEX idx_tasks_project ON tasks(project_id);
      CREATE INDEX idx_tasks_status_due ON tasks(status, due_at);
      CREATE INDEX idx_tasks_parent ON tasks(parent_id);

      CREATE TABLE task_dependencies (
        task_id       TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        blocked_by_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        PRIMARY KEY (task_id, blocked_by_id),
        CHECK (task_id <> blocked_by_id)
      );

      CREATE TABLE notes (
        id         TEXT PRIMARY KEY,
        title      TEXT NOT NULL,
        body       TEXT NOT NULL DEFAULT '',
        pinned     INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE UNIQUE INDEX idx_notes_title ON notes(title COLLATE NOCASE);

      CREATE TABLE note_links (
        from_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
        to_id   TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
        PRIMARY KEY (from_id, to_id)
      );
      CREATE INDEX idx_note_links_to ON note_links(to_id);

      CREATE TABLE habits (
        id              TEXT PRIMARY KEY,
        name            TEXT NOT NULL,
        icon            TEXT NOT NULL,
        color           TEXT NOT NULL,
        target_per_week INTEGER NOT NULL CHECK (target_per_week BETWEEN 1 AND 7),
        archived        INTEGER NOT NULL DEFAULT 0,
        created_at      TEXT NOT NULL
      );

      CREATE TABLE habit_logs (
        habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
        day      TEXT NOT NULL,
        PRIMARY KEY (habit_id, day)
      );

      CREATE TABLE journal_entries (
        day        TEXT PRIMARY KEY,
        mood       INTEGER NOT NULL CHECK (mood BETWEEN 1 AND 5),
        energy     INTEGER NOT NULL CHECK (energy BETWEEN 1 AND 5),
        body       TEXT NOT NULL DEFAULT '',
        updated_at TEXT NOT NULL
      );

      CREATE TABLE focus_sessions (
        id              TEXT PRIMARY KEY,
        kind            TEXT NOT NULL CHECK (kind IN ('pomodoro','deep_work','break')),
        task_id         TEXT REFERENCES tasks(id) ON DELETE SET NULL,
        started_at      TEXT NOT NULL,
        ended_at        TEXT,
        planned_minutes INTEGER NOT NULL,
        completed       INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX idx_focus_started ON focus_sessions(started_at);
    `,
  },
];
