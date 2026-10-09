/**
 * NEXUS Mind — main process entry.
 *
 * Boot sequence (target: first paint < 1s):
 *   1. Take the single-instance lock (a second launch focuses the first).
 *   2. Harden the session (permissions, navigation, popups).
 *   3. Open SQLite, run migrations, seed demo data on a fresh install.
 *   4. Register typed IPC handlers.
 *   5. Create the window (hidden until first paint), menu and global hotkey.
 */
import { join } from 'node:path';
import { app, BrowserWindow, globalShortcut, safeStorage } from 'electron';
import type { IpcEventSpec, Platform } from '@shared/ipc';
import { matchLocale } from '@shared/locale';
import { openBetterSqlite } from './db/drivers/better-sqlite';
import type { SqlDriver } from './db/driver';
import { migrate } from './db/migrate';
import { isEmptyWorkspace, seedDemoData } from './db/seed';
import { registerSummonHotkey } from './hotkeys';
import type { IpcHandlers } from './ipc/dispatch';
import { registerIpc } from './ipc/register';
import { log } from './logger';
import { buildMenu } from './menu';
import { KeyValueStore } from './repositories/kv';
import { SettingsRepository } from './repositories/settings-repo';
import { WorkspaceRepository } from './repositories/workspace-repo';
import { hardenApp, openExternalSafely } from './security';
import { SecretsService } from './services/secrets';
import { createMainWindow } from './window';

let mainWindow: BrowserWindow | null = null;
let db: SqlDriver | null = null;

function broadcast<E extends keyof IpcEventSpec>(event: E, payload: IpcEventSpec[E]): void {
  for (const win of BrowserWindow.getAllWindows()) win.webContents.send(event, payload);
}

function bootstrap(): void {
  hardenApp();

  const database = openBetterSqlite(join(app.getPath('userData'), 'nexus.db'));
  db = database;
  const applied = migrate(database);
  if (applied.length) log.info(`Applied migrations: ${applied.join(', ')}`);

  const osLocale = matchLocale(app.getPreferredSystemLanguages()[0] ?? app.getLocale());
  const kv = new KeyValueStore(database);
  const settings = new SettingsRepository(kv, osLocale);
  const workspace = new WorkspaceRepository(database);
  const secrets = new SecretsService(database, {
    isAvailable: () => safeStorage.isEncryptionAvailable(),
    encrypt: (plain) => safeStorage.encryptString(plain),
    decrypt: (cipher) => safeStorage.decryptString(Buffer.from(cipher)),
  });

  if (settings.isFirstRun()) {
    // Persist locale-aware defaults (Arabic OS → Arabic, RTL, Tajawal, Saturday week start).
    settings.update({});
    if (process.env['NEXUS_SEED_DEMO'] !== 'false' && isEmptyWorkspace(database)) {
      seedDemoData(database, { locale: settings.get().locale });
      log.info(`Seeded demo workspace (${settings.get().locale})`);
    }
  }

  const getWindow = (): BrowserWindow | null => mainWindow;

  const handlers: IpcHandlers = {
    'app:info': () => ({
      name: app.getName(),
      version: app.getVersion(),
      platform: process.platform as Platform,
      osLocale: app.getLocale(),
      secureStorageAvailable: safeStorage.isEncryptionAvailable(),
    }),
    'settings:get': () => settings.get(),
    'settings:update': (patch) => {
      const before = settings.get();
      const next = settings.update(patch);
      if (next.globalHotkey !== before.globalHotkey) registerSummonHotkey(next.globalHotkey, getWindow);
      broadcast('settings:changed', next);
      return next;
    },
    'secrets:status': () => secrets.status(),
    'secrets:set': ({ provider, value }) => secrets.set(provider, value),
    'secrets:delete': ({ provider }) => secrets.delete(provider),
    'workspace:summary': () => workspace.summary(new Date(), settings.get().weekStart),
    'shell:openExternal': ({ url }) => openExternalSafely(url),
  };
  registerIpc(handlers);

  mainWindow = createMainWindow(kv);
  mainWindow.on('closed', () => (mainWindow = null));
  buildMenu(getWindow);
  registerSummonHotkey(settings.get().globalHotkey, getWindow);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) mainWindow = createMainWindow(kv);
    else mainWindow?.show();
  });
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });

  app.setAppUserModelId('app.nexusmind.desktop');

  app
    .whenReady()
    .then(bootstrap)
    .catch((error: unknown) => {
      log.error('Fatal startup error', error);
      app.exit(1);
    });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
    db?.close();
  });
}
