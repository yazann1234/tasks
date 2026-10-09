import type { SupportedLocale } from '@shared/locale';
import { applySettingsPatch, hydrateSettings, type Settings } from '@shared/settings';
import { KeyValueStore } from './kv';

const KEY = 'settings';

/**
 * Persists {@link Settings} as one JSON document. Reads are tolerant
 * (invalid fields fall back to defaults), writes are strict.
 */
export class SettingsRepository {
  private cache: Settings | null = null;

  constructor(
    private readonly kv: KeyValueStore,
    /** Locale detected from the OS, used for first-run defaults. */
    private readonly osLocale: SupportedLocale,
  ) {}

  /** True until settings have been written once. */
  isFirstRun(): boolean {
    return this.kv.get(KEY) === undefined;
  }

  get(): Settings {
    this.cache ??= hydrateSettings(this.kv.get(KEY), this.osLocale);
    return this.cache;
  }

  /** Validates and persists a patch. Throws ZodError on invalid input. */
  update(patch: unknown): Settings {
    const next = applySettingsPatch(this.get(), patch);
    this.kv.set(KEY, next);
    this.cache = next;
    return next;
  }
}
