import { AnimatePresence, motion } from 'framer-motion';
import { Suspense, useEffect } from 'react';
import { directionalX } from '@shared/locale';
import { getFeature, FEATURES } from '../../features/registry';
import { useDirection } from '../../hooks/useLocale';
import { onEvent } from '../../lib/bridge';
import { useHotkeys } from '../../lib/hotkeys';
import { useLoadedSettings, useSettings } from '../../stores/settings';
import { useUi } from '../../stores/ui';
import { ErrorBoundary } from '../ErrorBoundary';
import { Aurora } from './Aurora';
import { CommandPalette } from './CommandPalette';
import { Sidebar } from './Sidebar';
import { TitleBar } from './TitleBar';

function ViewSkeleton(): JSX.Element {
  return (
    <div className="space-y-4 p-10" aria-hidden>
      {[60, 40, 80].map((w) => (
        <div key={w} className="h-6 animate-shimmer rounded-lg bg-[linear-gradient(90deg,rgb(var(--c-surface)),rgb(var(--c-elevated)),rgb(var(--c-surface)))] bg-[length:200%_100%]" style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}

/**
 * Root layout: title bar on top, sidebar on the start edge, routed view in
 * the remaining space. Owns global shortcuts and main-process commands.
 */
export function AppShell(): JSX.Element {
  const view = useUi((s) => s.view);
  const navigate = useUi((s) => s.navigate);
  const setPaletteOpen = useUi((s) => s.setPaletteOpen);
  const { sidebarCollapsed } = useLoadedSettings();
  const update = useSettings((s) => s.update);
  const dir = useDirection();
  const View = getFeature(view).component;

  useHotkeys({
    // Open (never toggle) so a menu accelerator and this handler firing together stay idempotent.
    'mod+k': () => setPaletteOpen(true),
    'mod+\\': () => void update({ sidebarCollapsed: !sidebarCollapsed }),
    ...Object.fromEntries(FEATURES.map((f) => [f.hotkey, () => navigate(f.id)])),
  });

  useEffect(
    () =>
      onEvent('app:command', (command) => {
        if (command === 'open-command-palette' || command === 'quick-capture') setPaletteOpen(true);
        if (command === 'open-settings') navigate('settings');
      }),
    [navigate, setPaletteOpen],
  );

  return (
    <div className="flex h-screen flex-col">
      <Aurora />
      <TitleBar />
      <div className="relative flex min-h-0 flex-1">
        <Sidebar />
        <main className="relative min-w-0 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={view}
              initial={{ opacity: 0, x: directionalX(14, dir) }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: directionalX(-8, dir) }}
              transition={{ type: 'spring', stiffness: 420, damping: 38, mass: 0.7 }}
              className="h-full"
            >
              <ErrorBoundary resetKey={view}>
                <Suspense fallback={<ViewSkeleton />}>
                  <View />
                </Suspense>
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
