import type * as NodeSqlite from 'node:sqlite';
import type { SqlDriver, SqlRow } from '../driver';

// Loaded at runtime: Vite 5 does not know `node:sqlite` is a builtin and would try to bundle it.
const { DatabaseSync } = process.getBuiltinModule('node:sqlite') as typeof NodeSqlite;

/**
 * `node:sqlite` driver. Used by unit tests (in-memory) so they run on plain
 * Node without the Electron-ABI build of better-sqlite3.
 */
export function openNodeSqlite(file = ':memory:'): SqlDriver {
  const db = new DatabaseSync(file);
  db.exec('PRAGMA foreign_keys = ON');
  let depth = 0;

  return {
    exec: (sql) => db.exec(sql),
    prepare: (sql) => {
      const stmt = db.prepare(sql);
      return {
        run: (...params) => ({ changes: Number(stmt.run(...params).changes) }),
        get: (...params) => stmt.get(...params) as SqlRow | undefined,
        all: (...params) => stmt.all(...params) as SqlRow[],
      };
    },
    transaction: (fn) => {
      // Nested calls join the outer transaction, matching better-sqlite3 semantics closely enough for tests.
      if (depth > 0) return fn();
      depth++;
      db.exec('BEGIN');
      try {
        const result = fn();
        db.exec('COMMIT');
        return result;
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      } finally {
        depth--;
      }
    },
    close: () => db.close(),
  };
}
