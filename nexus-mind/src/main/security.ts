import { app, session, shell, type WebContents } from 'electron';
import { log } from './logger';

const DEV_URL = process.env['ELECTRON_RENDERER_URL'];

/** True for our own renderer: the packaged file:// bundle or the dev server. */
export function isTrustedUrl(url: string): boolean {
  if (url.startsWith('file://')) return true;
  if (!app.isPackaged && DEV_URL && url.startsWith(DEV_URL)) return true;
  return false;
}

/** Opens https links in the default browser; everything else is dropped. */
export function openExternalSafely(url: string): void {
  try {
    if (new URL(url).protocol === 'https:') void shell.openExternal(url);
  } catch {
    log.warn('Refused to open invalid URL', url);
  }
}

/**
 * App-wide hardening, applied before any window is created:
 * - deny every permission except notifications and clipboard writes
 *   (microphone is granted later by the Voice module, on demand)
 * - block navigation away from the app and all `window.open` popups
 * - never attach a webview
 */
export function hardenApp(): void {
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(permission === 'notifications' || permission === 'clipboard-sanitized-write');
  });

  app.on('web-contents-created', (_event, contents: WebContents) => {
    contents.setWindowOpenHandler(({ url }) => {
      openExternalSafely(url);
      return { action: 'deny' };
    });
    contents.on('will-navigate', (event, url) => {
      if (!isTrustedUrl(url)) {
        event.preventDefault();
        openExternalSafely(url);
      }
    });
    contents.on('will-attach-webview', (event) => event.preventDefault());
  });
}
