/**
 * Preload — the only bridge between the sandboxed renderer and the main
 * process. It exposes a narrow, allow-listed API on `window.nexus`; the
 * renderer never sees `ipcRenderer`, Node or Electron objects.
 */
import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import { IPC_CHANNELS, IPC_EVENTS, type IpcEvent, type NexusBridge, type Platform } from '@shared/ipc';

const channels = new Set<string>(IPC_CHANNELS);
const events = new Set<string>(IPC_EVENTS);

const bridge: NexusBridge = {
  invoke: (channel, ...input) => {
    if (!channels.has(channel)) {
      return Promise.resolve({ ok: false, error: { code: 'NOT_FOUND', message: `Unknown channel ${channel}` } });
    }
    return ipcRenderer.invoke(channel, input[0]);
  },
  on: (event: IpcEvent, listener) => {
    if (!events.has(event)) throw new Error(`Unknown event ${event}`);
    const wrapped = (_e: IpcRendererEvent, payload: Parameters<typeof listener>[0]): void => listener(payload);
    ipcRenderer.on(event, wrapped);
    return () => {
      ipcRenderer.removeListener(event, wrapped);
    };
  },
  platform: process.platform as Platform,
};

contextBridge.exposeInMainWorld('nexus', bridge);
