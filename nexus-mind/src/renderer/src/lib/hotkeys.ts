/**
 * Keyboard shortcut matching that works on every keyboard layout.
 *
 * Shortcuts are matched on `KeyboardEvent.code` (physical key), not `key`.
 * On an Arabic layout the K key produces `key: "ن"`, so `key`-based matching
 * would break ⌘K for Arabic users; `code` stays `KeyK`.
 */
import { useEffect, useRef } from 'react';

export interface HotkeyEventLike {
  code: string;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

const NAMED_CODES: Record<string, string> = {
  ',': 'Comma',
  '.': 'Period',
  '/': 'Slash',
  '\\': 'Backslash',
  '[': 'BracketLeft',
  ']': 'BracketRight',
  enter: 'Enter',
  escape: 'Escape',
  space: 'Space',
};

function keyToCode(key: string): string {
  if (/^[a-z]$/.test(key)) return `Key${key.toUpperCase()}`;
  if (/^[0-9]$/.test(key)) return `Digit${key}`;
  return NAMED_CODES[key] ?? key;
}

/**
 * True if `event` matches `combo`, e.g. `mod+k`, `mod+shift+n`, `mod+,`.
 * `mod` is ⌘ on macOS and Ctrl elsewhere.
 */
export function matchesHotkey(event: HotkeyEventLike, combo: string, isMac: boolean): boolean {
  const parts = combo.toLowerCase().split('+');
  const key = parts.pop();
  if (!key) return false;
  const mods = new Set(parts);
  const wantMeta = mods.has('meta') || (isMac && mods.has('mod'));
  const wantCtrl = mods.has('ctrl') || (!isMac && mods.has('mod'));
  return (
    event.code === keyToCode(key) &&
    event.metaKey === wantMeta &&
    event.ctrlKey === wantCtrl &&
    event.shiftKey === mods.has('shift') &&
    event.altKey === mods.has('alt')
  );
}

/** Human-readable label for a combo, e.g. `⌘K` on macOS or `Ctrl+K` elsewhere. */
export function formatHotkey(combo: string, isMac: boolean): string {
  const symbols: Record<string, string> = isMac
    ? { mod: '⌘', meta: '⌘', ctrl: '⌃', shift: '⇧', alt: '⌥' }
    : { mod: 'Ctrl', meta: 'Win', ctrl: 'Ctrl', shift: 'Shift', alt: 'Alt' };
  const named: Record<string, string> = { escape: 'Esc', enter: '↵', space: 'Space' };
  const parts = combo.split('+').map((p) => symbols[p.toLowerCase()] ?? named[p.toLowerCase()] ?? (p.length === 1 ? p.toUpperCase() : p));
  return parts.join(isMac ? '' : '+');
}

/** True on macOS (uses the preload's platform, or the browser's in preview mode). */
export function isMacPlatform(): boolean {
  if (window.nexus) return window.nexus.platform === 'darwin';
  return navigator.platform.toLowerCase().includes('mac');
}

/** Registers several shortcuts with one listener. `bindings` maps combo → handler. */
export function useHotkeys(bindings: Record<string, (event: KeyboardEvent) => void>): void {
  const ref = useRef(bindings);
  ref.current = bindings;

  useEffect(() => {
    const isMac = isMacPlatform();
    const onKeyDown = (event: KeyboardEvent): void => {
      for (const [combo, handler] of Object.entries(ref.current)) {
        if (matchesHotkey(event, combo, isMac)) {
          event.preventDefault();
          handler(event);
          return;
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
