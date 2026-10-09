/**
 * Minimal synchronous SQL driver interface.
 *
 * Production uses better-sqlite3 (native, compiled against Electron's ABI).
 * Unit tests use Node's built-in `node:sqlite`, so tests never depend on a
 * native module built for a different runtime. Repositories only ever see
 * this interface.
 */

export type SqlValue = string | number | bigint | null | Uint8Array;
export type SqlRow = Record<string, SqlValue>;

export interface SqlStatement {
  run(...params: SqlValue[]): { changes: number };
  get(...params: SqlValue[]): SqlRow | undefined;
  all(...params: SqlValue[]): SqlRow[];
}

export interface SqlDriver {
  exec(sql: string): void;
  prepare(sql: string): SqlStatement;
  /** Runs `fn` atomically; rolls back and rethrows on error. */
  transaction<T>(fn: () => T): T;
  close(): void;
}

/** Reads a column as a string, failing loudly on schema drift. */
export function str(row: SqlRow, column: string): string {
  const v = row[column];
  if (typeof v !== 'string') throw new TypeError(`Column "${column}" expected TEXT, got ${typeof v}`);
  return v;
}

/** Reads a nullable TEXT column. */
export function strOrNull(row: SqlRow, column: string): string | null {
  const v = row[column];
  return v === null || v === undefined ? null : str(row, column);
}

/** Reads an INTEGER/REAL column as a JS number. */
export function num(row: SqlRow, column: string): number {
  const v = row[column];
  if (typeof v === 'number') return v;
  if (typeof v === 'bigint') return Number(v);
  throw new TypeError(`Column "${column}" expected a number, got ${typeof v}`);
}
