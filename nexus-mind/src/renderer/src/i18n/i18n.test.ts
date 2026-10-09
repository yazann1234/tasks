import { describe, expect, it } from 'vitest';
import { ar } from './ar';
import { en } from './en';
import { createFormatters } from './format';
import { initI18n } from './index';

type Tree = { [key: string]: string | Tree };

function leafKeys(tree: Tree, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([k, v]) => (typeof v === 'string' ? [`${prefix}${k}`] : leafKeys(v, `${prefix}${k}.`)));
}

describe('translations', () => {
  const enKeys = leafKeys(en as Tree);
  const arKeys = new Set(leafKeys(ar as Tree));

  it('Arabic covers every English key', () => {
    expect(enKeys.filter((k) => !arKeys.has(k))).toEqual([]);
  });

  it('Arabic plural keys define every CLDR category', () => {
    const categories = new Intl.PluralRules('ar').resolvedOptions().pluralCategories;
    const bases = new Set([...arKeys].filter((k) => /_(zero|one|two|few|many|other)$/.test(k)).map((k) => k.replace(/_[a-z]+$/, '')));
    expect(bases.size).toBeGreaterThan(0);
    for (const base of bases) for (const c of categories) expect(arKeys.has(`${base}_${c}`), `${base}_${c}`).toBe(true);
  });

  it('selects Arabic plural forms and localized digits', async () => {
    const i18n = initI18n('ar');
    await i18n.changeLanguage('ar');
    expect(i18n.t('home.dueToday', { count: 0 })).toContain('لا مهام');
    expect(i18n.t('home.dueToday', { count: 2 })).toContain('مهمتان');
    expect(i18n.t('home.dueToday', { count: 5 })).toContain('مهام');
    await i18n.changeLanguage('en');
    expect(i18n.t('home.dueToday', { count: 1 })).toBe('You have 1 task due today.');
  });
});

describe('formatters', () => {
  const date = new Date(2026, 9, 7, 9, 5);

  it('uses Arabic-Indic digits by default for Arabic', () => {
    const f = createFormatters({ locale: 'ar', numerals: 'auto', calendar: 'gregory' });
    expect(f.number(2026)).toBe('٢٬٠٢٦');
    expect(f.number(42)).toBe('٤٢');
    expect(f.longDate(date)).toContain('٢٠٢٦');
  });

  it('honours Western digits and the Hijri calendar', () => {
    const f = createFormatters({ locale: 'ar', numerals: 'latn', calendar: 'islamic-umalqura' });
    expect(f.number(42)).toBe('42');
    expect(f.longDate(date)).toMatch(/14\d\d/);
  });

  it('formats relative days and durations', () => {
    const f = createFormatters({ locale: 'en', numerals: 'auto', calendar: 'gregory' });
    expect(f.relativeDays(new Date(2026, 9, 8), date)).toBe('tomorrow');
    expect(f.relativeDays(new Date(2026, 9, 7, 23), date)).toBe('today');
    expect(f.duration(90)).toMatch(/1 hr.*30 min/);
    expect(f.duration(45)).toBe('45 min');
  });
});
