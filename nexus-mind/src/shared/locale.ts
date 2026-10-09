/**
 * Locale, direction, typography and Intl resolution.
 *
 * This module is shared by the main process (first-run OS locale detection)
 * and the renderer (applying `dir`, `lang`, fonts and Intl formatting).
 * Everything here is pure so it can be unit tested without Electron or a DOM.
 *
 * Walkthrough: a user picks Arabic → `resolveDirection` returns `rtl`,
 * `resolveUiFont` returns `tajawal`, and `intlLocaleTag` produces e.g.
 * `ar-SA-u-nu-arab-ca-gregory` so every date and number in the app is
 * rendered by Intl with the right digits and calendar.
 */

/** Locales that ship complete translations. */
export const SUPPORTED_LOCALES = ['en', 'ar'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/** Languages written right-to-left (ISO 639-1). Used for direction detection. */
const RTL_LANGUAGES: ReadonlySet<string> = new Set(['ar', 'fa', 'he', 'ur', 'ps', 'sd', 'ug', 'yi', 'dv', 'ku']);

export type Direction = 'ltr' | 'rtl';
export type DirectionPreference = 'auto' | Direction;
export type UiFont = 'auto' | 'tajawal' | 'inter' | 'system';
export type ResolvedUiFont = Exclude<UiFont, 'auto'>;
export type NumeralPreference = 'auto' | 'latn' | 'arab';
export type CalendarSystem = 'gregory' | 'islamic-umalqura';
/** 0 = Sunday, 1 = Monday, 6 = Saturday. */
export type WeekStart = 0 | 1 | 6;

/** Static metadata for each supported locale. */
export interface LocaleMeta {
  code: SupportedLocale;
  /** Name in its own language, shown in the language picker. */
  nativeName: string;
  /** BCP-47 region used for Intl formatting. */
  region: string;
  dir: Direction;
  defaultFont: ResolvedUiFont;
  defaultWeekStart: WeekStart;
}

export const LOCALE_META: Readonly<Record<SupportedLocale, LocaleMeta>> = {
  en: { code: 'en', nativeName: 'English', region: 'US', dir: 'ltr', defaultFont: 'inter', defaultWeekStart: 1 },
  ar: { code: 'ar', nativeName: 'العربية', region: 'SA', dir: 'rtl', defaultFont: 'tajawal', defaultWeekStart: 6 },
};

/** Type guard for {@link SupportedLocale}. */
export function isSupportedLocale(value: string): value is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** Returns the base language subtag of a BCP-47 tag (`ar-EG` → `ar`). */
export function baseLanguage(tag: string): string {
  return tag.trim().toLowerCase().split(/[-_]/)[0] ?? '';
}

/** True when the language of `tag` is written right-to-left. */
export function isRtlLanguage(tag: string): boolean {
  return RTL_LANGUAGES.has(baseLanguage(tag));
}

/**
 * Maps an OS locale (e.g. `ar-EG`, `en_GB`) to the closest supported locale.
 * Falls back to English.
 */
export function matchLocale(osLocale: string | undefined | null): SupportedLocale {
  if (!osLocale) return 'en';
  const base = baseLanguage(osLocale);
  return isSupportedLocale(base) ? base : 'en';
}

/** Resolves the layout direction, honouring a manual override. */
export function resolveDirection(locale: SupportedLocale, preference: DirectionPreference): Direction {
  return preference === 'auto' ? LOCALE_META[locale].dir : preference;
}

/**
 * Resolves the UI font. `auto` picks Tajawal for Arabic (and any RTL layout,
 * since Inter has no Arabic glyphs) and Inter otherwise.
 */
export function resolveUiFont(locale: SupportedLocale, font: UiFont, direction: Direction): ResolvedUiFont {
  if (font !== 'auto') return font;
  if (direction === 'rtl') return 'tajawal';
  return LOCALE_META[locale].defaultFont;
}

/** Resolves the numbering system: Arabic locales default to Arabic-Indic digits (٠١٢٣). */
export function resolveNumerals(locale: SupportedLocale, numerals: NumeralPreference): 'latn' | 'arab' {
  if (numerals !== 'auto') return numerals;
  return locale === 'ar' ? 'arab' : 'latn';
}

/** Options required to build an Intl locale tag. */
export interface IntlLocaleOptions {
  locale: SupportedLocale;
  numerals: NumeralPreference;
  calendar: CalendarSystem;
}

/**
 * Builds a BCP-47 tag with Unicode extensions for Intl APIs,
 * e.g. `ar-SA-u-nu-arab-ca-islamic-umalqura`.
 */
export function intlLocaleTag({ locale, numerals, calendar }: IntlLocaleOptions): string {
  const meta = LOCALE_META[locale];
  const nu = resolveNumerals(locale, numerals);
  return `${meta.code}-${meta.region}-u-nu-${nu}-ca-${calendar}`;
}

/**
 * Converts a direction-agnostic horizontal offset into a physical one.
 * Use for motion: "slide in from the start edge" is `-x` in LTR and `+x` in RTL.
 */
export function directionalX(offset: number, direction: Direction): number {
  return direction === 'rtl' ? -offset : offset;
}
