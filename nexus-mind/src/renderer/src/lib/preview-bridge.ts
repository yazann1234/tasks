/**
 * Development-only stand-in for the preload bridge, used when the renderer
 * is opened in a regular browser (`npm run dev` → open the Vite URL). It keeps
 * settings in localStorage and serves a static demo summary. It deliberately
 * cannot store secrets.
 */
import type { IpcChannel, IpcEvent, IpcEventSpec, IpcOutput, IpcResult, NexusBridge } from '@shared/ipc';
import { ipcInputSchemas } from '@shared/ipc';
import { matchLocale } from '@shared/locale';
import { applySettingsPatch, hydrateSettings, type Settings } from '@shared/settings';

const STORAGE_KEY = 'nexus.preview.settings';

export function createPreviewBridge(): NexusBridge {
  const listeners = new Map<IpcEvent, Set<(payload: never) => void>>();
  const osLocale = matchLocale(navigator.language);

  const readSettings = (): Settings => {
    try {
      return hydrateSettings(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'), osLocale);
    } catch {
      return hydrateSettings(null, osLocale);
    }
  };

  const emit = <E extends IpcEvent>(event: E, payload: IpcEventSpec[E]): void => {
    listeners.get(event)?.forEach((l) => (l as (p: IpcEventSpec[E]) => void)(payload));
  };

  const ok = <T,>(data: T): IpcResult<T> => ({ ok: true, data });

  const handle = (channel: IpcChannel, input: unknown): IpcResult<IpcOutput<IpcChannel>> => {
    const parsed = ipcInputSchemas[channel].safeParse(input);
    if (!parsed.success) return { ok: false, error: { code: 'VALIDATION', message: parsed.error.message } };
    switch (channel) {
      case 'app:info':
        return ok({ name: 'NEXUS Mind (preview)', version: 'dev', platform: 'linux', osLocale: navigator.language, secureStorageAvailable: false });
      case 'settings:get':
        return ok(readSettings());
      case 'settings:update': {
        const next = applySettingsPatch(readSettings(), parsed.data);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Storage may be unavailable (private mode); keep running in-memory.
        }
        emit('settings:changed', next);
        return ok(next);
      }
      case 'secrets:status':
        return ok({ openai: false, anthropic: false });
      case 'secrets:set':
      case 'secrets:delete':
        return { ok: false, error: { code: 'SECURE_STORAGE_UNAVAILABLE', message: 'Preview mode cannot store secrets' } };
      case 'workspace:summary':
        return ok({ projects: 3, openTasks: 15, dueToday: 1, overdue: 1, completedThisWeek: 4, notes: 5, habits: 3, focusMinutesThisWeek: 415 });
      case 'shell:openExternal':
        window.open((parsed.data as { url: string }).url, '_blank', 'noopener');
        return ok(undefined);
    }
  };

  return {
    invoke: (channel, ...input) => Promise.resolve(handle(channel, input[0]) as IpcResult<IpcOutput<typeof channel>>),
    on: (event, listener) => {
      const set = listeners.get(event) ?? new Set();
      set.add(listener as (payload: never) => void);
      listeners.set(event, set);
      return () => set.delete(listener as (payload: never) => void);
    },
    platform: 'linux',
  };
}
