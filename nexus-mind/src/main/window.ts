import { join } from 'node:path';
import { BrowserWindow, nativeTheme, screen } from 'electron';
import type { KeyValueStore } from './repositories/kv';

interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  maximized: boolean;
}

const BOUNDS_KEY = 'window.main.bounds';
const MIN = { width: 960, height: 640 };

function isBounds(value: unknown): value is WindowBounds {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return ['x', 'y', 'width', 'height'].every((k) => typeof v[k] === 'number') && typeof v['maximized'] === 'boolean';
}

/** Restores saved bounds only if they are still visible on a connected display. */
function restoreBounds(kv: KeyValueStore): WindowBounds | null {
  const saved = kv.get(BOUNDS_KEY);
  if (!isBounds(saved)) return null;
  const visible = screen.getAllDisplays().some(({ workArea: a }) =>
    saved.x < a.x + a.width && saved.x + saved.width > a.x && saved.y < a.y + a.height && saved.y + saved.height > a.y,
  );
  return visible ? saved : null;
}

/**
 * Creates the main window: frameless with native window controls overlaid
 * (Windows/Linux) or inset traffic lights (macOS), shown only once the first
 * frame is painted to avoid a white flash. The renderer is fully sandboxed.
 */
export function createMainWindow(kv: KeyValueStore): BrowserWindow {
  const saved = restoreBounds(kv);
  const isMac = process.platform === 'darwin';

  const win = new BrowserWindow({
    width: saved?.width ?? 1360,
    height: saved?.height ?? 860,
    ...(saved ? { x: saved.x, y: saved.y } : {}),
    minWidth: MIN.width,
    minHeight: MIN.height,
    show: false,
    backgroundColor: '#0A0A0F',
    titleBarStyle: 'hidden',
    ...(isMac
      ? { trafficLightPosition: { x: 16, y: 14 }, vibrancy: 'under-window' as const, visualEffectState: 'active' as const }
      : { titleBarOverlay: { color: '#00000000', symbolColor: '#E5E7EB', height: 44 } }),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
      spellcheck: true,
    },
  });

  nativeTheme.themeSource = 'dark';
  if (saved?.maximized) win.maximize();
  win.once('ready-to-show', () => win.show());

  let saveTimer: NodeJS.Timeout | undefined;
  const persist = (): void => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      if (win.isDestroyed() || win.isMinimized()) return;
      kv.set(BOUNDS_KEY, { ...win.getNormalBounds(), maximized: win.isMaximized() } satisfies WindowBounds);
    }, 400);
  };
  win.on('resize', persist);
  win.on('move', persist);
  win.on('close', persist);

  const devUrl = process.env['ELECTRON_RENDERER_URL'];
  if (devUrl) void win.loadURL(devUrl);
  else void win.loadFile(join(__dirname, '../renderer/index.html'));

  return win;
}

/** Updates the overlaid window-control colours when the theme changes. */
export function setTitleBarColors(win: BrowserWindow, symbolColor: string): void {
  if (process.platform === 'darwin' || win.isDestroyed()) return;
  win.setTitleBarOverlay({ color: '#00000000', symbolColor, height: 44 });
}
