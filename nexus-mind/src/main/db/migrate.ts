import type { SqlDriver } from './driver';
import { MIGRATIONS, type Migration } from './migrations';
import { num } from './driver';

/** Current schema version stored in the database header. */
export function schemaVersion(db: SqlDriver): number {
  const row = db.prepare('PRAGMA user_version').get();
  return row ? num(row, 'user_version') : 0;
}

/**
 * Applies every pending migration, each in its own transaction.
 * Returns the versions that were applied. Refuses to open a database written
 * by a newer app version rather than risk corrupting it.
 */
export function migrate(db: SqlDriver, migrations: readonly Migration[] = MIGRATIONS): number[] {
  const sorted = [...migrations].sort((a, b) => a.version - b.version);
  const latest = sorted.at(-1)?.version ?? 0;
  const current = schemaVersion(db);

  if (current > latest) {
    throw new Error(`Database schema v${current} is newer than this app supports (v${latest}). Please update NEXUS Mind.`);
  }

  const applied: number[] = [];
  for (const m of sorted) {
    if (m.version <= current) continue;
    db.transaction(() => {
      db.exec(m.sql);
      // PRAGMA cannot be parameterised; version is a trusted integer from our own source.
      db.exec(`PRAGMA user_version = ${Math.trunc(m.version)}`);
    });
    applied.push(m.version);
  }
  return applied;
}
