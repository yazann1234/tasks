import { app, Menu, type BrowserWindow, type MenuItemConstructorOptions } from 'electron';
import type { AppCommand } from '@shared/ipc';

/**
 * Native menu. Besides discoverability it provides the standard
 * clipboard/undo accelerators, which Electron only wires through menu roles.
 */
export function buildMenu(getWindow: () => BrowserWindow | null): void {
  const send = (command: AppCommand) => () => getWindow()?.webContents.send('app:command', command);
  const isMac = process.platform === 'darwin';

  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? [{
          label: app.name,
          submenu: [
            { role: 'about' },
            { type: 'separator' },
            { label: 'Settings…', accelerator: 'Cmd+,', click: send('open-settings') },
            { type: 'separator' },
            { role: 'hide' },
            { role: 'hideOthers' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' },
          ],
        } satisfies MenuItemConstructorOptions]
      : []),
    {
      label: 'File',
      submenu: [
        { label: 'Quick Capture', accelerator: 'CmdOrCtrl+Shift+N', click: send('quick-capture') },
        { label: 'Command Palette', accelerator: 'CmdOrCtrl+K', click: send('open-command-palette') },
        ...(isMac ? [] : [{ label: 'Settings', accelerator: 'Ctrl+,', click: send('open-settings') } satisfies MenuItemConstructorOptions]),
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        ...(app.isPackaged ? [] : [{ role: 'reload' }, { role: 'toggleDevTools' }] satisfies MenuItemConstructorOptions[]),
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    { role: 'windowMenu' },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
