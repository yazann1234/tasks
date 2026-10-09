import { describe, expect, it } from 'vitest';
import { openNodeSqlite } from './drivers/node-sqlite';
import { migrate, schemaVersion } from './migrate';
import { MIGRATIONS } from './migrations';

describe('migrate', () => {
  it('applies all migrations to a fresh database, once', () => {
    const db = openNodeSqlite();
    expect(migrate(db)).toEqual(MIGRATIONS.map((m) => m.version));
    expect(schemaVersion(db)).toBe(MIGRATIONS.at(-1)?.version);
    expect(migrate(db)).toEqual([]);
  });

  it('applies only pending migrations', () => {
    const db = openNodeSqlite();
    const extra = [...MIGRATIONS, { version: 99, name: 'extra', sql: 'CREATE TABLE extra (id INTEGER PRIMARY KEY);' }];
    migrate(db);
    expect(migrate(db, extra)).toEqual([99]);
    expect(schemaVersion(db)).toBe(99);
  });

  it('rolls back a failing migration', () => {
    const db = openNodeSqlite();
    migrate(db);
    const before = schemaVersion(db);
    const broken = [...MIGRATIONS, { version: 50, name: 'broken', sql: 'CREATE TABLE ok (id INT); SELECT * FROM nope;' }];
    expect(() => migrate(db, broken)).toThrow();
    expect(schemaVersion(db)).toBe(before);
    expect(db.prepare("SELECT name FROM sqlite_master WHERE name = 'ok'").get()).toBeUndefined();
  });

  it('refuses databases from a newer app version', () => {
    const db = openNodeSqlite();
    db.exec('PRAGMA user_version = 999');
    expect(() => migrate(db)).toThrow(/newer/);
  });

  it('enforces task constraints', () => {
    const db = openNodeSqlite();
    migrate(db);
    const now = new Date().toISOString();
    expect(() =>
      db.prepare("INSERT INTO tasks (id, title, status, created_at, updated_at) VALUES ('t', 'x', 'bogus', ?, ?)").run(now, now),
    ).toThrow();
  });
});
