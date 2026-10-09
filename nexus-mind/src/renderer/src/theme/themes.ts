/**
 * Theme engine. Each theme is a set of colour tokens written as CSS
 * variables (`--c-<token>: R G B`) so Tailwind can apply opacity modifiers
 * (`bg-accent/20`). Adding a theme = adding an entry here.
 */
import type { ThemeId } from '@shared/settings';

export const TOKENS = ['bg', 'surface', 'elevated', 'border', 'fg', 'muted', 'subtle', 'accent', 'plasma', 'amber', 'danger', 'success'] as const;
export type Token = (typeof TOKENS)[number];

export interface ThemeDefinition {
  id: ThemeId;
  scheme: 'dark' | 'light';
  colors: Record<Token, string>;
  /** Three hex colours for the animated aurora background. */
  aurora: [string, string, string];
}

export const THEMES: Readonly<Record<ThemeId, ThemeDefinition>> = {
  obsidian: {
    id: 'obsidian',
    scheme: 'dark',
    colors: {
      bg: '#0A0A0F', surface: '#111118', elevated: '#181821', border: '#272736', fg: '#F4F4F8', muted: '#A3A3B8',
      subtle: '#6B6B80', accent: '#7C3AED', plasma: '#06B6D4', amber: '#F59E0B', danger: '#F43F5E', success: '#10B981',
    },
    aurora: ['#7C3AED', '#06B6D4', '#F59E0B'],
  },
  nebula: {
    id: 'nebula',
    scheme: 'dark',
    colors: {
      bg: '#0B0614', surface: '#130B21', elevated: '#1B112D', border: '#2E2045', fg: '#F7F2FF', muted: '#B5A6CF',
      subtle: '#76688F', accent: '#A855F7', plasma: '#EC4899', amber: '#FBBF24', danger: '#FB7185', success: '#34D399',
    },
    aurora: ['#A855F7', '#EC4899', '#6366F1'],
  },
  midnight: {
    id: 'midnight',
    scheme: 'dark',
    colors: {
      bg: '#050B14', surface: '#0B1422', elevated: '#111D2F', border: '#1F2E45', fg: '#EEF6FF', muted: '#9DB2CC',
      subtle: '#62758F', accent: '#0EA5E9', plasma: '#22D3EE', amber: '#F59E0B', danger: '#F43F5E', success: '#10B981',
    },
    aurora: ['#0EA5E9', '#22D3EE', '#6366F1'],
  },
  ember: {
    id: 'ember',
    scheme: 'dark',
    colors: {
      bg: '#0F0A06', surface: '#18110B', elevated: '#211810', border: '#3A2A1C', fg: '#FFF7ED', muted: '#CDB59C',
      subtle: '#8C7560', accent: '#F59E0B', plasma: '#EF4444', amber: '#FCD34D', danger: '#F43F5E', success: '#84CC16',
    },
    aurora: ['#F59E0B', '#EF4444', '#7C3AED'],
  },
  'aurora-light': {
    id: 'aurora-light',
    scheme: 'light',
    colors: {
      bg: '#F6F6FB', surface: '#FFFFFF', elevated: '#FFFFFF', border: '#E3E3EE', fg: '#0F0F1A', muted: '#55556A',
      subtle: '#8A8AA0', accent: '#7C3AED', plasma: '#0891B2', amber: '#D97706', danger: '#E11D48', success: '#059669',
    },
    aurora: ['#C4B5FD', '#A5F3FC', '#FDE68A'],
  },
  paper: {
    id: 'paper',
    scheme: 'light',
    colors: {
      bg: '#FAF7F2', surface: '#FFFDF9', elevated: '#FFFFFF', border: '#E8E0D4', fg: '#1C1917', muted: '#57534E',
      subtle: '#8F877E', accent: '#B45309', plasma: '#0F766E', amber: '#D97706', danger: '#BE123C', success: '#15803D',
    },
    aurora: ['#FED7AA', '#99F6E4', '#E9D5FF'],
  },
};

/** `#7C3AED` → `124 58 237`. */
export function hexToRgbTriplet(hex: string): string {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (!m) throw new Error(`Invalid hex colour: ${hex}`);
  return [m[1], m[2], m[3]].map((h) => parseInt(h ?? '0', 16)).join(' ');
}

/** CSS variables for a theme, ready for `element.style.setProperty`. */
export function themeVariables(theme: ThemeDefinition): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const token of TOKENS) vars[`--c-${token}`] = hexToRgbTriplet(theme.colors[token]);
  theme.aurora.forEach((c, i) => (vars[`--aurora-${i + 1}`] = c));
  return vars;
}
