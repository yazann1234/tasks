/**
 * i18next setup. Resources are bundled (no network, instant switching).
 * `{{count, num}}` in a string formats numbers with the user's digit and
 * calendar preferences via the active {@link Formatters}.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { SupportedLocale } from '@shared/locale';
import { ar } from './ar';
import { en } from './en';
import { createFormatters, type Formatters } from './format';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: typeof en };
  }
}

let active: Formatters = createFormatters({ locale: 'en', numerals: 'auto', calendar: 'gregory' });

/** Called by the locale hook whenever language/digit/calendar settings change. */
export function setActiveFormatters(formatters: Formatters): void {
  active = formatters;
}

export function initI18n(locale: SupportedLocale): typeof i18n {
  if (!i18n.isInitialized) {
    void i18n.use(initReactI18next).init({
      lng: locale,
      fallbackLng: 'en',
      supportedLngs: ['en', 'ar'],
      resources: { en: { translation: en }, ar: { translation: ar } },
      interpolation: { escapeValue: false },
      returnNull: false,
      initImmediate: false,
    });
    i18n.services.formatter?.add('num', (value: unknown) => (typeof value === 'number' ? active.number(value) : String(value)));
  }
  return i18n;
}

export { i18n };
