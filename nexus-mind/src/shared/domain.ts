/**
 * Core domain entities persisted in SQLite.
 *
 * Timestamps are ISO-8601 strings in UTC. Dates without a time
 * (journal days, habit logs) are `YYYY-MM-DD` strings in local time.
 */

export type TaskStatus = 'inbox' | 'todo' | 'in_progress' | 'done' | 'archived';

/** 0 = none, 1 = low, 2 = medium, 3 = high. */
export type Priority = 0 | 1 | 2 | 3;

export interface Project {
  id: string;
  name: string;
  /** Hex colour used for chips and graph nodes. */
  color: string;
  icon: string;
  archived: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  projectId: string | null;
  parentId: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  /** Eisenhower axes. */
  urgent: boolean;
  important: boolean;
  dueAt: string | null;
  scheduledStart: string | null;
  estimateMinutes: number | null;
  /** RFC 5545 RRULE, e.g. `FREQ=MONTHLY;BYDAY=2TU`. */
  recurrence: string | null;
  tags: string[];
  sortOrder: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  title: string;
  /** Markdown body; `[[Note title]]` creates a bi-directional link. */
  body: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  /** Target completions per week (1–7). */
  targetPerWeek: number;
  archived: boolean;
  createdAt: string;
}

export interface HabitLog {
  habitId: string;
  day: string;
}

/** 1 (low) – 5 (high). */
export type Scale5 = 1 | 2 | 3 | 4 | 5;

export interface JournalEntry {
  day: string;
  mood: Scale5;
  energy: Scale5;
  body: string;
  updatedAt: string;
}

export type FocusKind = 'pomodoro' | 'deep_work' | 'break';

export interface FocusSession {
  id: string;
  kind: FocusKind;
  taskId: string | null;
  startedAt: string;
  endedAt: string | null;
  plannedMinutes: number;
  completed: boolean;
}

/** Snapshot shown on the Home view; computed in a single SQL round-trip. */
export interface WorkspaceSummary {
  projects: number;
  openTasks: number;
  dueToday: number;
  overdue: number;
  completedThisWeek: number;
  notes: number;
  habits: number;
  focusMinutesThisWeek: number;
}
