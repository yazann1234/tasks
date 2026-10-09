import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import { IPC_CHANNELS } from '@shared/ipc';
import { dispatch, type IpcHandlers } from './dispatch';
import { isTrustedUrl } from '../security';

/**
 * Wires every channel in the contract to `ipcMain.handle`, rejecting calls
 * from frames that are not our own renderer (e.g. an injected iframe).
 */
export function registerIpc(handlers: IpcHandlers): void {
  for (const channel of IPC_CHANNELS) {
    ipcMain.handle(channel, (event: IpcMainInvokeEvent, raw: unknown) => {
      const url = event.senderFrame?.url ?? '';
      if (!isTrustedUrl(url)) {
        return { ok: false, error: { code: 'VALIDATION', message: 'Untrusted sender' } };
      }
      return dispatch(handlers, channel, raw);
    });
  }
}
