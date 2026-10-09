/**
 * Applies language, direction, font, theme and density to the document
 * whenever settings change, and exposes memoised formatters.
 *
 * `<html lang dir>` drives: Tailwind logical utilities (ms-/me-/ps-/pe-/start-/end-),
 * the `rtl:` variant, the browser's bidi algorithm, and the Arabic CSS rules.
 */
import { useEffect, useMemo } from 'react';
import { resolveDirection, resolveUiFont, type Direction } from '@shared/locale';
import type { Settings } from '@shared/settings';
import { i18n, setActiveFormatters } from '../i18n';
import { createFormatters, type Formatters } from '../i18n/format';
import { THEMES, themeVariables } from '../theme/themes';
import { useLoadedSettings } from '../stores/settings';

export function applyDocumentSettings(settings: Settings, root: HTMLElement = document.documentElement): Direction {
  const dir = resolveDirection(settings.locale, settings.direction);
  const theme = THEMES[settings.theme];
  root.lang = settings.locale;
  root.dir = dir;
  root.dataset['font'] = resolveUiFont(settings.locale, settings.uiFont, dir);
  root.dataset['theme'] = theme.id;
  root.dataset['scheme'] = theme.scheme;
  root.dataset['density'] = settings.density;
  root.dataset['reduceMotion'] = String(settings.reduceMotion);
  root.style.setProperty('--font-scale', String(settings.fontScale / 100));
  for (const [name, value] of Object.entries(themeVariables(theme))) root.style.setProperty(name, value);
  return dir;
}

/** Keeps the document in sync with settings; call once near the root. */
export function useApplySettings(): void {
  const settings = useLoadedSettings();
  useEffect(() => {
    applyDocumentSettings(settings);
    if (i18n.language !== settings.locale) void i18n.changeLanguage(settings.locale);
  }, [settings]);
}

/** Current layout direction. */
export function useDirection(): Direction {
  const { locale, direction } = useLoadedSettings();
  return resolveDirection(locale, direction);
}

/** Intl formatters honouring digit and calendar preferences. */
export function useFormatters(): Formatters {
  const { locale, numerals, calendar } = useLoadedSettings();
  return useMemo(() => {
    const f = createFormatters({ locale, numerals, calendar });
    setActiveFormatters(f);
    return f;
  }, [locale, numerals, calendar]);
}
