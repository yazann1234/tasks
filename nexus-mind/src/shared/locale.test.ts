import { describe, expect, it } from 'vitest';
import {
  directionalX,
  intlLocaleTag,
  isRtlLanguage,
  matchLocale,
  resolveDirection,
  resolveNumerals,
  resolveUiFont,
} from './locale';

describe('locale resolution', () => {
  it('matches OS locales to supported locales', () => {
    expect(matchLocale('ar-EG')).toBe('ar');
    expect(matchLocale('ar_SA')).toBe('ar');
    expect(matchLocale('en-GB')).toBe('en');
    expect(matchLocale('fr-FR')).toBe('en');
    expect(matchLocale('')).toBe('en');
    expect(matchLocale(undefined)).toBe('en');
  });

  it('detects RTL languages', () => {
    for (const tag of ['ar', 'ar-AE', 'fa-IR', 'he', 'ur-PK']) expect(isRtlLanguage(tag)).toBe(true);
    for (const tag of ['en', 'fr', 'tr', 'arn']) expect(isRtlLanguage(tag)).toBe(false);
  });

  it('resolves direction from locale unless overridden', () => {
    expect(resolveDirection('ar', 'auto')).toBe('rtl');
    expect(resolveDirection('en', 'auto')).toBe('ltr');
    expect(resolveDirection('ar', 'ltr')).toBe('ltr');
    expect(resolveDirection('en', 'rtl')).toBe('rtl');
  });

  it('defaults to Tajawal for Arabic and any RTL layout', () => {
    expect(resolveUiFont('ar', 'auto', 'rtl')).toBe('tajawal');
    expect(resolveUiFont('en', 'auto', 'rtl')).toBe('tajawal');
    expect(resolveUiFont('en', 'auto', 'ltr')).toBe('inter');
    expect(resolveUiFont('ar', 'inter', 'rtl')).toBe('inter');
  });

  it('builds Intl tags with numbering system and calendar', () => {
    expect(intlLocaleTag({ locale: 'ar', numerals: 'auto', calendar: 'gregory' })).toBe('ar-SA-u-nu-arab-ca-gregory');
    expect(intlLocaleTag({ locale: 'ar', numerals: 'latn', calendar: 'islamic-umalqura' })).toBe(
      'ar-SA-u-nu-latn-ca-islamic-umalqura',
    );
    expect(intlLocaleTag({ locale: 'en', numerals: 'auto', calendar: 'gregory' })).toBe('en-US-u-nu-latn-ca-gregory');
    expect(resolveNumerals('en', 'arab')).toBe('arab');
  });

  it('produces tags Intl accepts', () => {
    const tag = intlLocaleTag({ locale: 'ar', numerals: 'arab', calendar: 'islamic-umalqura' });
    expect(new Intl.NumberFormat(tag).format(123)).toBe('١٢٣');
    expect(new Intl.DateTimeFormat(tag).resolvedOptions().calendar).toBe('islamic-umalqura');
  });

  it('mirrors horizontal motion in RTL', () => {
    expect(directionalX(24, 'ltr')).toBe(24);
    expect(directionalX(24, 'rtl')).toBe(-24);
  });
});
