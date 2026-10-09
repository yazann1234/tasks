import type { WorkspaceSummary } from '@shared/domain';
import { addDays, startOfDay, startOfWeek } from '@shared/dates';
import type { WeekStart } from '@shared/locale';
import type { SqlDriver } from '../db/driver';
import { num } from '../db/driver';

/** Aggregate queries for the Home view. */
export class WorkspaceRepository {
  constructor(private readonly db: SqlDriver) {}

  /** Computes all counters in a single statement. */
  summary(now: Date, weekStart: WeekStart): WorkspaceSummary {
    const today = startOfDay(now).toISOString();
    const tomorrow = addDays(startOfDay(now), 1).toISOString();
    const week = startOfWeek(now, weekStart).toISOString();
    const open = `status NOT IN ('done','archived')`;

    const row = this.db
      .prepare(
        /* sql */ `
        SELECT
          (SELECT COUNT(*) FROM projects WHERE archived = 0)                                   AS projects,
          (SELECT COUNT(*) FROM tasks WHERE ${open})                                           AS openTasks,
          (SELECT COUNT(*) FROM tasks WHERE ${open} AND due_at >= ? AND due_at < ?)            AS dueToday,
          (SELECT COUNT(*) FROM tasks WHERE ${open} AND due_at < ?)                            AS overdue,
          (SELECT COUNT(*) FROM tasks WHERE status = 'done' AND completed_at >= ?)             AS completedThisWeek,
          (SELECT COUNT(*) FROM notes)                                                         AS notes,
          (SELECT COUNT(*) FROM habits WHERE archived = 0)                                     AS habits,
          (SELECT COALESCE(SUM(planned_minutes), 0) FROM focus_sessions
             WHERE completed = 1 AND kind <> 'break' AND started_at >= ?)                      AS focusMinutesThisWeek
      `,
      )
      .get(today, tomorrow, today, week, week);

    if (!row) throw new Error('Summary query returned no row');
    return {
      projects: num(row, 'projects'),
      openTasks: num(row, 'openTasks'),
      dueToday: num(row, 'dueToday'),
      overdue: num(row, 'overdue'),
      completedThisWeek: num(row, 'completedThisWeek'),
      notes: num(row, 'notes'),
      habits: num(row, 'habits'),
      focusMinutesThisWeek: num(row, 'focusMinutesThisWeek'),
    };
  }
}
