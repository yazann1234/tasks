import { randomUUID } from 'node:crypto';
import { addDays, startOfDay, toDayKey } from '@shared/dates';
import type { SupportedLocale } from '@shared/locale';
import { normalizeTitle, parseWikiLinks } from '@shared/wikilinks';
import type { SqlDriver } from './driver';
import { num } from './driver';
import { SEED_CONTENT } from './seed-content';

/** Deterministic PRNG (mulberry32) so demo heatmaps look the same every install. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** True when the database holds no user content yet. */
export function isEmptyWorkspace(db: SqlDriver): boolean {
  const row = db.prepare('SELECT (SELECT COUNT(*) FROM tasks) + (SELECT COUNT(*) FROM notes) AS n').get();
  return !row || num(row, 'n') === 0;
}

export interface SeedOptions {
  locale: SupportedLocale;
  now?: Date;
  /** Days of habit/journal/focus history to generate. */
  historyDays?: number;
  newId?: () => string;
}

/**
 * Populates an empty workspace with realistic demo data in the user's language:
 * projects, tasks (with subtasks, a dependency and recurrence), linked notes,
 * habits with ~3 months of history, journal entries and focus sessions.
 * Runs in one transaction; a failure leaves the database untouched.
 */
export function seedDemoData(db: SqlDriver, { locale, now = new Date(), historyDays = 90, newId = randomUUID }: SeedOptions): void {
  const content = SEED_CONTENT[locale];
  const rand = mulberry32(20_240_917);
  const iso = now.toISOString();
  const today = startOfDay(now);

  db.transaction(() => {
    const projectIds = new Map<string, string>();
    const insertProject = db.prepare(
      'INSERT INTO projects (id, name, color, icon, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    );
    content.projects.forEach((p, i) => {
      const id = newId();
      projectIds.set(p.key, id);
      insertProject.run(id, p.name, p.color, p.icon, i, iso, iso);
    });

    const insertTask = db.prepare(
      `INSERT INTO tasks (id, project_id, parent_id, title, description, status, priority, urgent, important,
         due_at, estimate_minutes, recurrence, tags, sort_order, completed_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const taskIds = new Map<string, string>();
    content.tasks.forEach((t, i) => {
      const id = newId();
      taskIds.set(t.title, id);
      const projectId = t.project ? (projectIds.get(t.project) ?? null) : null;
      let dueAt: string | null = null;
      if (t.due !== undefined) {
        const due = addDays(today, t.due);
        due.setHours(t.hour ?? 23, t.hour === undefined ? 59 : 0, 0, 0);
        dueAt = due.toISOString();
      }
      const completedAt = t.status === 'done' ? (dueAt ?? iso) : null;
      insertTask.run(
        id, projectId, null, t.title, t.description ?? '', t.status, t.priority,
        t.urgent ? 1 : 0, t.important ? 1 : 0, dueAt, t.estimate ?? null, t.recurrence ?? null,
        JSON.stringify(t.tags), i, completedAt, iso, iso,
      );
      t.subtasks?.forEach((title, j) => {
        insertTask.run(
          newId(), projectId, id, title, '', j === 0 ? 'done' : 'todo', 0, 0, 0, null, null, null,
          '[]', j, j === 0 ? iso : null, iso, iso,
        );
      });
    });

    const insertDep = db.prepare('INSERT INTO task_dependencies (task_id, blocked_by_id) VALUES (?, ?)');
    for (const t of content.tasks) {
      if (!t.blockedBy) continue;
      const taskId = taskIds.get(t.title);
      const blockerId = taskIds.get(t.blockedBy);
      if (taskId && blockerId) insertDep.run(taskId, blockerId);
    }

    const noteIds = new Map<string, string>();
    const insertNote = db.prepare('INSERT INTO notes (id, title, body, pinned, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
    for (const n of content.notes) {
      const id = newId();
      noteIds.set(normalizeTitle(n.title), id);
      insertNote.run(id, n.title, n.body, n.pinned ? 1 : 0, iso, iso);
    }
    const insertLink = db.prepare('INSERT OR IGNORE INTO note_links (from_id, to_id) VALUES (?, ?)');
    for (const n of content.notes) {
      const fromId = noteIds.get(normalizeTitle(n.title));
      for (const target of parseWikiLinks(n.body)) {
        const toId = noteIds.get(normalizeTitle(target));
        if (fromId && toId && fromId !== toId) insertLink.run(fromId, toId);
      }
    }

    const insertHabit = db.prepare(
      'INSERT INTO habits (id, name, icon, color, target_per_week, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    );
    const insertLog = db.prepare('INSERT INTO habit_logs (habit_id, day) VALUES (?, ?)');
    for (const h of content.habits) {
      const id = newId();
      insertHabit.run(id, h.name, h.icon, h.color, h.targetPerWeek, addDays(today, -historyDays).toISOString());
      for (let d = historyDays; d >= 1; d--) {
        if (rand() < h.adherence) insertLog.run(id, toDayKey(addDays(today, -d)));
      }
    }

    const insertJournal = db.prepare('INSERT INTO journal_entries (day, mood, energy, body, updated_at) VALUES (?, ?, ?, ?, ?)');
    for (let d = Math.min(historyDays, 21); d >= 1; d--) {
      const mood = 2 + Math.floor(rand() * 4);
      const energy = Math.max(1, Math.min(5, mood + Math.round(rand() * 2 - 1)));
      const body = content.journal[d % content.journal.length] ?? '';
      insertJournal.run(toDayKey(addDays(today, -d)), mood, energy, body, iso);
    }

    const insertFocus = db.prepare(
      'INSERT INTO focus_sessions (id, kind, task_id, started_at, ended_at, planned_minutes, completed) VALUES (?, ?, ?, ?, ?, ?, ?)',
    );
    const focusTaskIds = [...taskIds.values()];
    for (let d = Math.min(historyDays, 30); d >= 0; d--) {
      const day = addDays(today, -d);
      const isWeekendish = day.getDay() === 5 || day.getDay() === 6;
      const sessions = isWeekendish ? Math.floor(rand() * 2) : 1 + Math.floor(rand() * 4);
      for (let s = 0; s < sessions; s++) {
        const start = new Date(day);
        start.setHours(9 + s * 2, Math.floor(rand() * 30), 0, 0);
        if (start > now) continue;
        const deep = rand() < 0.35;
        const minutes = deep ? 90 : 25;
        const end = new Date(start.getTime() + minutes * 60_000);
        const taskId = focusTaskIds[Math.floor(rand() * focusTaskIds.length)] ?? null;
        insertFocus.run(newId(), deep ? 'deep_work' : 'pomodoro', taskId, start.toISOString(), end.toISOString(), minutes, rand() < 0.88 ? 1 : 0);
      }
    }
  });
}
