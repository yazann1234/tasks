import { describe, expect, it } from 'vitest';
import { openNodeSqlite } from '../db/drivers/node-sqlite';
import { migrate } from '../db/migrate';
import { AppError } from '../errors';
import { SecretsService, type Cipher } from '../services/secrets';
import { KeyValueStore } from './kv';
import { SettingsRepository } from './settings-repo';

function setup() {
  const db = openNodeSqlite();
  migrate(db);
  return db;
}

/** Reversible fake cipher: XOR, so tests can prove ciphertext ≠ plaintext. */
const fakeCipher = (available = true): Cipher => ({
  isAvailable: () => available,
  encrypt: (s) => Uint8Array.from(Buffer.from(s, 'utf8').map((b) => b ^ 0x5a)),
  decrypt: (c) => Buffer.from(Uint8Array.from(c).map((b) => b ^ 0x5a)).toString('utf8'),
});

describe('SettingsRepository', () => {
  it('starts with OS-locale defaults and persists updates', () => {
    const db = setup();
    const repo = new SettingsRepository(new KeyValueStore(db), 'ar');
    expect(repo.isFirstRun()).toBe(true);
    expect(repo.get()).toMatchObject({ locale: 'ar', weekStart: 6 });
    repo.update({ theme: 'nebula' });
    expect(repo.isFirstRun()).toBe(false);
    const reopened = new SettingsRepository(new KeyValueStore(db), 'en');
    expect(reopened.get()).toMatchObject({ locale: 'ar', theme: 'nebula' });
  });

  it('rejects invalid patches without persisting them', () => {
    const repo = new SettingsRepository(new KeyValueStore(setup()), 'en');
    expect(() => repo.update({ fontScale: 9000 })).toThrow();
    expect(repo.get().fontScale).toBe(100);
  });
});

describe('SecretsService', () => {
  it('stores keys encrypted and reports status without exposing them', () => {
    const db = setup();
    const secrets = new SecretsService(db, fakeCipher());
    expect(secrets.status()).toEqual({ openai: false, anthropic: false });
    expect(secrets.set('anthropic', 'sk-ant-test-123456')).toEqual({ openai: false, anthropic: true });

    const raw = db.prepare('SELECT cipher FROM secrets').get()?.['cipher'];
    expect(raw).toBeInstanceOf(Uint8Array);
    expect(Buffer.from(raw as Uint8Array).toString('utf8')).not.toContain('sk-ant');
    expect(secrets.reveal('anthropic')).toBe('sk-ant-test-123456');

    expect(secrets.delete('anthropic')).toEqual({ openai: false, anthropic: false });
    expect(secrets.reveal('anthropic')).toBeNull();
  });

  it('refuses to store secrets when the keychain is unavailable', () => {
    const secrets = new SecretsService(setup(), fakeCipher(false));
    expect(() => secrets.set('openai', 'sk-test-abcdefgh')).toThrow(AppError);
    expect(secrets.status().openai).toBe(false);
  });
});
