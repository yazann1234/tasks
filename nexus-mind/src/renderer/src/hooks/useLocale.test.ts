import { describe, expect, it } from 'vitest';
import { defaultSettings } from '@shared/settings';
import { applyDocumentSettings } from './useLocale';

describe('applyDocumentSettings', () => {
  it('switches the document to Arabic RTL with Tajawal', () => {
    const root = document.createElement('html');
    const dir = applyDocumentSettings(defaultSettings('ar'), root);
    expect(dir).toBe('rtl');
    expect(root.getAttribute('dir')).toBe('rtl');
    expect(root.getAttribute('lang')).toBe('ar');
    expect(root.dataset['font']).toBe('tajawal');
    expect(root.style.getPropertyValue('--c-accent')).toBe('124 58 237');
  });

  it('respects manual overrides', () => {
    const root = document.createElement('html');
    applyDocumentSettings({ ...defaultSettings('ar'), direction: 'ltr', uiFont: 'inter', theme: 'paper' }, root);
    expect(root.dir).toBe('ltr');
    expect(root.dataset['font']).toBe('inter');
    expect(root.dataset['scheme']).toBe('light');
  });
});
