import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { applySettingsPatch, defaultSettings, hydrateSettings } from './settings';

describe('settings', () => {
  it('uses locale-aware defaults', () => {
    const ar = defaultSettings('ar');
    expect(ar.locale).toBe('ar');
    expect(ar.weekStart).toBe(6);
    expect(ar.uiFont).toBe('auto');
    expect(defaultSettings('en').weekStart).toBe(1);
  });

  it('hydrates partial and partially invalid data field by field', () => {
    const s = hydrateSettings({ theme: 'nebula', density: 'enormous', fontScale: 500, locale: 'ar', unknown: 1 }, 'en');
    expect(s.theme).toBe('nebula');
    expect(s.locale).toBe('ar');
    expect(s.density).toBe('comfortable');
    expect(s.fontScale).toBe(100);
    expect(s).not.toHaveProperty('unknown');
  });

  it('falls back to defaults for non-object input', () => {
    expect(hydrateSettings(null, 'ar')).toEqual(defaultSettings('ar'));
    expect(hydrateSettings('corrupt', 'en')).toEqual(defaultSettings('en'));
  });

  it('applies valid patches and rejects invalid ones', () => {
    const base = defaultSettings('en');
    expect(applySettingsPatch(base, { locale: 'ar', uiFont: 'tajawal' })).toMatchObject({ locale: 'ar', uiFont: 'tajawal' });
    expect(() => applySettingsPatch(base, { theme: 'neon' })).toThrow(ZodError);
    expect(() => applySettingsPatch(base, { evil: true })).toThrow(ZodError);
  });
});
