import { globalShortcut, type BrowserWindow } from 'electron';
import { log } from './logger';

let registered: string | null = null;

/**
 * Registers the summon-from-anywhere hotkey (feature #17). Pressing it shows
 * and focuses the window and opens the command palette; pressing it again
 * while focused hides the window. Returns false if the OS refused the combo.
 */
export function registerSummonHotkey(accelerator: string, getWindow: () => BrowserWindow | null): boolean {
  if (registered) globalShortcut.unregister(registered);
  registered = null;
  try {
    const ok = globalShortcut.register(accelerator, () => {
      const win = getWindow();
      if (!win) return;
      if (win.isFocused()) {
        win.hide();
        return;
      }
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
      win.webContents.send('app:command', 'open-command-palette');
    });
    if (ok) registered = accelerator;
    else log.warn(`Global hotkey ${accelerator} is taken by another app`);
    return ok;
  } catch (error) {
    log.warn(`Invalid accelerator ${accelerator}`, error);
    return false;
  }
}
