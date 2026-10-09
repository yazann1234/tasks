/**
 * Renderer mirror of persisted settings. Updates are optimistic: the UI
 * changes instantly, the main process validates and persists, and on failure
 * the previous value is restored with an error toast.
 */
import { create } from 'zustand';
import type { Settings, SettingsPatch } from '@shared/settings';
import { BridgeError, invoke, onEvent } from '../lib/bridge';
import { i18n } from '../i18n';
import { toast } from './toasts';

interface SettingsState {
  settings: Settings | null;
  loadError: BridgeError | null;
  load(): Promise<void>;
  update(patch: SettingsPatch): Promise<void>;
}

export const useSettings = create<SettingsState>((set, get) => ({
  settings: null,
  loadError: null,
  load: async () => {
    try {
      const settings = await invoke('settings:get');
      set({ settings, loadError: null });
      onEvent('settings:changed', (next) => set({ settings: next }));
    } catch (error) {
      set({ loadError: error instanceof BridgeError ? error : new BridgeError('INTERNAL', String(error)) });
    }
  },
  update: async (patch) => {
    const previous = get().settings;
    if (!previous) return;
    set({ settings: { ...previous, ...patch } });
    try {
      set({ settings: await invoke('settings:update', patch) });
    } catch (error) {
      set({ settings: previous });
      const code = error instanceof BridgeError ? error.code : 'INTERNAL';
      toast.error(i18n.t(`errors.${code}`));
    }
  },
}));

/** Selector hook for settings that are guaranteed loaded (used below the boot gate). */
export function useLoadedSettings(): Settings {
  const settings = useSettings((s) => s.settings);
  if (!settings) throw new Error('Settings accessed before load');
  return settings;
}
