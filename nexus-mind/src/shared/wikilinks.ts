/**
 * Bi-directional link parsing for notes.
 *
 * `[[Title]]` and `[[Title|alias]]` reference another note by title.
 * Titles are matched case-insensitively and may contain any script,
 * including Arabic (`[[خطة الإطلاق]]`).
 */

const WIKILINK = /\[\[([^\[\]|\n]+?)(?:\|[^\[\]\n]*)?\]\]/g;

/** Returns the distinct link targets in order of first appearance. */
export function parseWikiLinks(markdown: string): string[] {
  const seen = new Map<string, string>();
  for (const match of markdown.matchAll(WIKILINK)) {
    const title = match[1]?.trim();
    if (!title) continue;
    const key = normalizeTitle(title);
    if (!seen.has(key)) seen.set(key, title);
  }
  return [...seen.values()];
}

/** Canonical form used to compare note titles. */
export function normalizeTitle(title: string): string {
  return title.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}
