import { describe, expect, it } from 'vitest';
import { formatHotkey, matchesHotkey, type HotkeyEventLike } from './hotkeys';

const ev = (code: string, mods: Partial<HotkeyEventLike> = {}): HotkeyEventLike => ({
  code,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  ...mods,
});

describe('matchesHotkey', () => {
  it('maps mod to ⌘ on macOS and Ctrl elsewhere', () => {
    expect(matchesHotkey(ev('KeyK', { metaKey: true }), 'mod+k', true)).toBe(true);
    expect(matchesHotkey(ev('KeyK', { ctrlKey: true }), 'mod+k', true)).toBe(false);
    expect(matchesHotkey(ev('KeyK', { ctrlKey: true }), 'mod+k', false)).toBe(true);
  });

  it('works on an Arabic keyboard layout (matches physical key)', () => {
    // On the Arabic layout, the K key reports key="ن" but code="KeyK".
    expect(matchesHotkey(ev('KeyK', { ctrlKey: true }), 'mod+k', false)).toBe(true);
  });

  it('requires exact modifiers', () => {
    expect(matchesHotkey(ev('KeyN', { ctrlKey: true }), 'mod+shift+n', false)).toBe(false);
    expect(matchesHotkey(ev('KeyN', { ctrlKey: true, shiftKey: true }), 'mod+shift+n', false)).toBe(true);
    expect(matchesHotkey(ev('Comma', { ctrlKey: true }), 'mod+,', false)).toBe(true);
    expect(matchesHotkey(ev('Digit1', { ctrlKey: true }), 'mod+1', false)).toBe(true);
  });

  it('formats labels per platform', () => {
    expect(formatHotkey('mod+k', true)).toBe('⌘K');
    expect(formatHotkey('mod+shift+n', false)).toBe('Ctrl+Shift+N');
    expect(formatHotkey('escape', false)).toBe('Esc');
  });
});
