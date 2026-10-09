import { describe, expect, it } from 'vitest';
import { num, str } from './driver';
import { openNodeSqlite } from './drivers/node-sqlite';
import { migrate } from './migrate';
import { isEmptyWorkspace, seedDemoData } from './seed';
import { SEED_CONTENT } from './seed-content';
import { WorkspaceRepository } from '../repositories/workspace-repo';

function count(db: ReturnType<typeof openNodeSqlite>, table: string): number {
  const row = db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get();
  return row ? num(row, 'n') : 0;
}

describe('seedDemoData', () => {
  const now = new Date(2026, 9, 7, 14, 0);

  it.each(['en', 'ar'] as const)('seeds a complete %s workspace', (locale) => {
    const db = openNodeSqlite();
    migrate(db);
    expect(isEmptyWorkspace(db)).toBe(true);
    seedDemoData(db, { locale, now });
    expect(isEmptyWorkspace(db)).toBe(false);

    const content = SEED_CONTENT[locale];
    const subtasks = content.tasks.reduce((n, t) => n + (t.subtasks?.length ?? 0), 0);
    expect(count(db, 'projects')).toBe(content.projects.length);
    expect(count(db, 'tasks')).toBe(content.tasks.length + subtasks);
    expect(count(db, 'notes')).toBe(content.notes.length);
    expect(count(db, 'task_dependencies')).toBe(1);
    expect(count(db, 'note_links')).toBeGreaterThanOrEqual(content.notes.length);
    expect(count(db, 'habit_logs')).toBeGreaterThan(100);
    expect(count(db, 'journal_entries')).toBe(21);
    expect(count(db, 'focus_sessions')).toBeGreaterThan(20);

    const firstProject = db.prepare('SELECT name FROM projects ORDER BY sort_order LIMIT 1').get();
    expect(firstProject && str(firstProject, 'name')).toBe(content.projects[0]?.name);
  });

  it('is deterministic for habit history', () => {
    const logs = () => {
      const db = openNodeSqlite();
      migrate(db);
      seedDemoData(db, { locale: 'en', now });
      return count(db, 'habit_logs');
    };
    expect(logs()).toBe(logs());
  });

  it('feeds a consistent workspace summary', () => {
    const db = openNodeSqlite();
    migrate(db);
    seedDemoData(db, { locale: 'ar', now });
    const summary = new WorkspaceRepository(db).summary(now, 6);
    expect(summary.projects).toBe(3);
    expect(summary.notes).toBe(5);
    expect(summary.habits).toBe(3);
    expect(summary.dueToday).toBe(1);
    expect(summary.overdue).toBeGreaterThanOrEqual(1);
    expect(summary.openTasks).toBeGreaterThan(summary.dueToday);
    expect(summary.focusMinutesThisWeek).toBeGreaterThan(0);
  });
});
