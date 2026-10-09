import type { SqlDriver } from '../db/driver';
import { str } from '../db/driver';

/** Tiny JSON key–value store on top of the `kv` table. */
export class KeyValueStore {
  constructor(private readonly db: SqlDriver) {}

  /** Returns the parsed JSON value, or `undefined` if missing or unreadable. */
  get(key: string): unknown {
    const row = this.db.prepare('SELECT value FROM kv WHERE key = ?').get(key);
    if (!row) return undefined;
    try {
      return JSON.parse(str(row, 'value')) as unknown;
    } catch {
      return undefined;
    }
  }

  set(key: string, value: unknown): void {
    this.db
      .prepare(
        `INSERT INTO kv (key, value, updated_at) VALUES (?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'))
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      )
      .run(key, JSON.stringify(value));
  }
}
