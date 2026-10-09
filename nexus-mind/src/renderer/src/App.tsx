import { MotionConfig } from 'framer-motion';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppShell } from './components/shell/AppShell';
import { Toaster } from './components/Toaster';
import { useApplySettings, useFormatters } from './hooks/useLocale';
import { useLoadedSettings, useSettings } from './stores/settings';

function LoadedApp(): JSX.Element {
  useApplySettings();
  useFormatters();
  const { reduceMotion } = useLoadedSettings();
  return (
    <MotionConfig reducedMotion={reduceMotion ? 'always' : 'user'}>
      <AppShell />
      <Toaster />
    </MotionConfig>
  );
}

/**
 * Boot gate: loads settings once (a single local SQLite read, typically a
 * few ms) before rendering, so the first frame already has the right
 * language, direction, font and theme — no flash of LTR/English.
 */
export function App(): JSX.Element | null {
  const { t } = useTranslation();
  const settings = useSettings((s) => s.settings);
  const loadError = useSettings((s) => s.loadError);
  const load = useSettings((s) => s.load);

  useEffect(() => {
    void load();
  }, [load]);

  if (loadError) {
    return (
      <div role="alert" className="grid h-screen place-items-center p-10 text-center">
        <div>
          <p className="font-display text-xl">{t(`errors.${loadError.code}`)}</p>
          <button type="button" onClick={() => void load()} className="focus-ring mt-4 rounded-xl bg-accent px-4 py-2 text-sm text-white">
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }
  return settings ? <LoadedApp /> : null;
}
