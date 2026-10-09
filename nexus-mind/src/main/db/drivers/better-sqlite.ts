import Database from 'better-sqlite3';
import type { SqlDriver, SqlRow, SqlValue } from '../driver';

/**
 * Opens a better-sqlite3 database tuned for a single-user desktop app:
 * WAL for concurrent reads during writes, foreign keys enforced.
 */
export function openBetterSqlite(file: string): SqlDriver {
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('foreign_keys = ON');

  return {
    exec: (sql) => {
      db.exec(sql);
    },
    prepare: (sql) => {
      const stmt = db.prepare<SqlValue[], SqlRow>(sql);
      return {
        run: (...params) => ({ changes: stmt.run(...params).changes }),
        get: (...params) => stmt.get(...params),
        all: (...params) => stmt.all(...params),
      };
    },
    transaction: (fn) => db.transaction(fn)(),
    close: () => db.close(),
  };
}
