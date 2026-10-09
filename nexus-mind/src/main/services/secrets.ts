import { AI_PROVIDERS, type AiProvider, type SecretStatus } from '@shared/ipc';
import type { SqlDriver } from '../db/driver';
import { AppError } from '../errors';

/** OS-backed encryption (Electron `safeStorage` in production, a fake in tests). */
export interface Cipher {
  isAvailable(): boolean;
  encrypt(plain: string): Uint8Array;
  decrypt(cipher: Uint8Array): string;
}

/**
 * Stores API keys encrypted with the OS keychain. Plaintext never touches
 * disk and never leaves the main process: the renderer can only ask whether
 * a key exists.
 */
export class SecretsService {
  constructor(
    private readonly db: SqlDriver,
    private readonly cipher: Cipher,
  ) {}

  status(): SecretStatus {
    const rows = this.db.prepare('SELECT provider FROM secrets').all();
    const present = new Set(rows.map((r) => r['provider']));
    return Object.fromEntries(AI_PROVIDERS.map((p) => [p, present.has(p)])) as SecretStatus;
  }

  set(provider: AiProvider, value: string): SecretStatus {
    if (!this.cipher.isAvailable()) {
      throw new AppError('SECURE_STORAGE_UNAVAILABLE', 'The OS keychain is unavailable; refusing to store the key in plaintext.');
    }
    const encrypted = this.cipher.encrypt(value);
    this.db
      .prepare(
        `INSERT INTO secrets (provider, cipher, updated_at) VALUES (?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'))
         ON CONFLICT(provider) DO UPDATE SET cipher = excluded.cipher, updated_at = excluded.updated_at`,
      )
      .run(provider, encrypted);
    return this.status();
  }

  delete(provider: AiProvider): SecretStatus {
    this.db.prepare('DELETE FROM secrets WHERE provider = ?').run(provider);
    return this.status();
  }

  /** Main-process only: decrypts a key for an outgoing API call. */
  reveal(provider: AiProvider): string | null {
    const row = this.db.prepare('SELECT cipher FROM secrets WHERE provider = ?').get(provider);
    const blob = row?.['cipher'];
    if (!(blob instanceof Uint8Array)) return null;
    if (!this.cipher.isAvailable()) {
      throw new AppError('SECURE_STORAGE_UNAVAILABLE', 'The OS keychain is unavailable.');
    }
    return this.cipher.decrypt(blob);
  }
}
