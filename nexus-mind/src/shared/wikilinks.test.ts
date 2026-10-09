import { describe, expect, it } from 'vitest';
import { normalizeTitle, parseWikiLinks } from './wikilinks';

describe('parseWikiLinks', () => {
  it('extracts distinct targets in order, ignoring aliases', () => {
    expect(parseWikiLinks('See [[Launch Plan]] and [[Risks|the risks]], again [[launch plan]].')).toEqual([
      'Launch Plan',
      'Risks',
    ]);
  });

  it('supports Arabic titles', () => {
    expect(parseWikiLinks('راجع [[خطة الإطلاق]] و[[مخاطر الإطلاق]]')).toEqual(['خطة الإطلاق', 'مخاطر الإطلاق']);
  });

  it('ignores empty and malformed links', () => {
    expect(parseWikiLinks('[[ ]] [[a\nb]] [single] [[ok]]')).toEqual(['ok']);
  });

  it('normalizes whitespace and case', () => {
    expect(normalizeTitle('  Launch   PLAN ')).toBe('launch plan');
  });
});
