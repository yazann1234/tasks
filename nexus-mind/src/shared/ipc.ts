/**
 * The single source of truth for main ↔ renderer communication.
 *
 * - `IpcSpec` declares every request channel with its input and output types.
 * - `ipcInputSchemas` validates inputs at runtime in the main process, so a
 *   compromised or buggy renderer can never send malformed data to SQLite.
 * - `IpcEventSpec` declares push events (main → renderer).
 *
 * Adding a channel: add it to `IpcSpec` + `ipcInputSchemas`, then register a
 * handler in `src/main/ipc`. TypeScript fails the build until all three match.
 */
import { z } from 'zod';
import type { WorkspaceSummary } from './domain';
import { settingsPatchSchema, type Settings, type SettingsPatch } from './settings';

export const AI_PROVIDERS = ['openai', 'anthropic'] as const;
export type AiProvider = (typeof AI_PROVIDERS)[number];

/** Desktop platforms Electron ships on. */
export type Platform = 'darwin' | 'win32' | 'linux';

export interface AppInfo {
  name: string;
  version: string;
  platform: Platform;
  /** OS locale reported by Electron, e.g. `ar-SA`. */
  osLocale: string;
  /** False when the OS keychain is unavailable; secrets cannot be stored then. */
  secureStorageAvailable: boolean;
}

export type SecretStatus = Record<AiProvider, boolean>;

export interface IpcSpec {
  'app:info': { input: void; output: AppInfo };
  'settings:get': { input: void; output: Settings };
  'settings:update': { input: SettingsPatch; output: Settings };
  'secrets:status': { input: void; output: SecretStatus };
  'secrets:set': { input: { provider: AiProvider; value: string }; output: SecretStatus };
  'secrets:delete': { input: { provider: AiProvider }; output: SecretStatus };
  'workspace:summary': { input: void; output: WorkspaceSummary };
  'shell:openExternal': { input: { url: string }; output: void };
}

export type IpcChannel = keyof IpcSpec;
export type IpcInput<C extends IpcChannel> = IpcSpec[C]['input'];
export type IpcOutput<C extends IpcChannel> = IpcSpec[C]['output'];

const noInput = z.void();

export const ipcInputSchemas: { [C in IpcChannel]: z.ZodType<IpcInput<C>, z.ZodTypeDef, unknown> } = {
  'app:info': noInput,
  'settings:get': noInput,
  'settings:update': settingsPatchSchema,
  'secrets:status': noInput,
  'secrets:set': z.object({ provider: z.enum(AI_PROVIDERS), value: z.string().trim().min(8).max(512) }).strict(),
  'secrets:delete': z.object({ provider: z.enum(AI_PROVIDERS) }).strict(),
  'workspace:summary': noInput,
  'shell:openExternal': z
    .object({ url: z.string().url().refine((u) => u.startsWith('https://'), 'Only https links may be opened') })
    .strict(),
};

export const IPC_CHANNELS = Object.keys(ipcInputSchemas) as IpcChannel[];

/** Error codes surfaced to the UI; messages are localised by code in the renderer. */
export type IpcErrorCode = 'VALIDATION' | 'NOT_FOUND' | 'SECURE_STORAGE_UNAVAILABLE' | 'INTERNAL';

/** Wire format: errors are values, never thrown across the bridge. */
export type IpcResult<T> = { ok: true; data: T } | { ok: false; error: { code: IpcErrorCode; message: string } };

/** Commands the main process can ask the UI to perform (menu, tray, global hotkey). */
export type AppCommand = 'open-command-palette' | 'open-settings' | 'quick-capture';

export interface IpcEventSpec {
  'settings:changed': Settings;
  'app:command': AppCommand;
}

export type IpcEvent = keyof IpcEventSpec;
export const IPC_EVENTS: readonly IpcEvent[] = ['settings:changed', 'app:command'];

/** The API exposed on `window.nexus` by the preload script. */
export interface NexusBridge {
  invoke<C extends IpcChannel>(channel: C, ...input: IpcInput<C> extends void ? [] : [IpcInput<C>]): Promise<IpcResult<IpcOutput<C>>>;
  on<E extends IpcEvent>(event: E, listener: (payload: IpcEventSpec[E]) => void): () => void;
  platform: Platform;
}
