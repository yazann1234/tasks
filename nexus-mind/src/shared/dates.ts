/**
 * Calendar helpers working in the user's local time zone.
 * Pure functions: always pass `now` explicitly so callers stay testable.
 */
import type { WeekStart } from './locale';

/** `YYYY-MM-DD` for the local calendar day of `date`. */
export function toDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Local midnight at the start of `date`'s day. */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Adds whole local days (DST-safe because it works on calendar fields). */
export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Local midnight at the start of the week containing `date`. */
export function startOfWeek(date: Date, weekStart: WeekStart): Date {
  const day = startOfDay(date);
  const diff = (day.getDay() - weekStart + 7) % 7;
  return addDays(day, -diff);
}
