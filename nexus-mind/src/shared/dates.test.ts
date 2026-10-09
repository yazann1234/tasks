import { describe, expect, it } from 'vitest';
import { addDays, startOfWeek, toDayKey } from './dates';

describe('dates', () => {
  const wed = new Date(2026, 9, 7, 15, 30); // Wednesday 7 Oct 2026

  it('formats local day keys', () => {
    expect(toDayKey(wed)).toBe('2026-10-07');
    expect(toDayKey(addDays(wed, 30))).toBe('2026-11-06');
  });

  it('computes week start for Saturday, Sunday and Monday weeks', () => {
    expect(toDayKey(startOfWeek(wed, 6))).toBe('2026-10-03');
    expect(toDayKey(startOfWeek(wed, 0))).toBe('2026-10-04');
    expect(toDayKey(startOfWeek(wed, 1))).toBe('2026-10-05');
    const sat = new Date(2026, 9, 3, 9);
    expect(toDayKey(startOfWeek(sat, 6))).toBe('2026-10-03');
  });
});
