/**
 * Application settings: schema, defaults and patch validation.
 *
 * Settings live in SQLite (main process) and are mirrored in a Zustand store
 * (renderer). Every write goes through {@link settingsPatchSchema} so a bad
 * value from the UI, an older database or a plugin can never corrupt state.
 */
import { z } from 'zod';
import { LOCALE_META, SUPPORTED_LOCALES, type SupportedLocale } from './locale';

export const THEME_IDS = ['obsidian', 'nebula', 'midnight', 'ember', 'aurora-light', 'paper'] as const;
export type ThemeId = (typeof THEME_IDS)[number];

export const settingsSchema = z.object({
  locale: z.enum(SUPPORTED_LOCALES),
  direction: z.enum(['auto', 'ltr', 'rtl']),
  uiFont: z.enum(['auto', 'tajawal', 'inter', 'system']),
  numerals: z.enum(['auto', 'latn', 'arab']),
  calendar: z.enum(['gregory', 'islamic-umalqura']),
  weekStart: z.union([z.literal(0), z.literal(1), z.literal(6)]),
  theme: z.enum(THEME_IDS),
  density: z.enum(['compact', 'comfortable', 'spacious']),
  /** UI scale in percent, applied to the root font size. */
  fontScale: z.number().int().min(85).max(130),
  reduceMotion: z.boolean(),
  sounds: z.boolean(),
  /** Electron accelerator for the summon-from-anywhere hotkey. */
  globalHotkey: z.string().min(1).max(64),
  sidebarCollapsed: z.boolean(),
  onboardingCompleted: z.boolean(),
});

export type Settings = z.infer<typeof settingsSchema>;

export const settingsPatchSchema = settingsSchema.partial().strict();
export type SettingsPatch = z.infer<typeof settingsPatchSchema>;

/** Defaults for a given locale. Arabic users get Tajawal, Saturday week start and RTL. */
export function defaultSettings(locale: SupportedLocale = 'en'): Settings {
  return {
    locale,
    direction: 'auto',
    uiFont: 'auto',
    numerals: 'auto',
    calendar: 'gregory',
    weekStart: LOCALE_META[locale].defaultWeekStart,
    theme: 'obsidian',
    density: 'comfortable',
    fontScale: 100,
    reduceMotion: false,
    sounds: true,
    globalHotkey: 'CommandOrControl+Shift+Space',
    sidebarCollapsed: false,
    onboardingCompleted: false,
  };
}

/**
 * Merges persisted (possibly stale or partially invalid) JSON over defaults.
 * Invalid fields are dropped individually instead of resetting everything.
 */
export function hydrateSettings(raw: unknown, fallbackLocale: SupportedLocale = 'en'): Settings {
  const base = defaultSettings(fallbackLocale);
  if (typeof raw !== 'object' || raw === null) return base;

  const merged: Record<string, unknown> = { ...base };
  const shape = settingsSchema.shape;
  for (const [key, value] of Object.entries(raw)) {
    if (!(key in shape)) continue;
    const field = shape[key as keyof typeof shape];
    if (field.safeParse(value).success) merged[key] = value;
  }
  return settingsSchema.parse(merged);
}

/** Applies a validated patch. Throws a ZodError on invalid input. */
export function applySettingsPatch(current: Settings, patch: unknown): Settings {
  const parsed = settingsPatchSchema.parse(patch);
  return settingsSchema.parse({ ...current, ...parsed });
}
