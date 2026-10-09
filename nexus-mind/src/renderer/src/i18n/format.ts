/**
 * Locale-aware formatting built on Intl. All user-visible numbers, dates
 * and durations go through these helpers so Arabic-Indic digits and the
 * Hijri calendar apply everywhere consistently.
 */
import { intlLocaleTag, type IntlLocaleOptions } from '@shared/locale';

export interface Formatters {
  tag: string;
  number(value: number): string;
  /** Long date, e.g. "Wednesday, 7 October 2026" / "الأربعاء، ٢٥ ربيع الآخر ١٤٤٨ هـ". */
  longDate(date: Date): string;
  time(date: Date): string;
  /** "today", "tomorrow", "in 3 days" — relative to `now`. */
  relativeDays(date: Date, now: Date): string;
  /** Minutes as a compact duration, e.g. "1 hr, 30 min". */
  duration(minutes: number): string;
}

const DAY_MS = 86_400_000;

/** Creates formatters for the given locale preferences. Cheap enough to call on settings change. */
export function createFormatters(options: IntlLocaleOptions): Formatters {
  const tag = intlLocaleTag(options);
  const numberFmt = new Intl.NumberFormat(tag);
  const longDateFmt = new Intl.DateTimeFormat(tag, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeFmt = new Intl.DateTimeFormat(tag, { hour: 'numeric', minute: '2-digit' });
  const relFmt = new Intl.RelativeTimeFormat(tag, { numeric: 'auto' });
  const hourFmt = new Intl.NumberFormat(tag, { style: 'unit', unit: 'hour', unitDisplay: 'short' });
  const minuteFmt = new Intl.NumberFormat(tag, { style: 'unit', unit: 'minute', unitDisplay: 'short' });
  const list = new Intl.ListFormat(tag, { style: 'narrow', type: 'unit' });

  return {
    tag,
    number: (value) => numberFmt.format(value),
    longDate: (date) => longDateFmt.format(date),
    time: (date) => timeFmt.format(date),
    relativeDays: (date, now) => {
      const a = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      const b = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      return relFmt.format(Math.round((a - b) / DAY_MS), 'day');
    },
    duration: (minutes) => {
      const total = Math.max(0, Math.round(minutes));
      const h = Math.floor(total / 60);
      const m = total % 60;
      if (h === 0) return minuteFmt.format(m);
      if (m === 0) return hourFmt.format(h);
      return list.format([hourFmt.format(h), minuteFmt.format(m)]);
    },
  };
}
