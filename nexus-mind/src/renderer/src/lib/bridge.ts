/**
 * Renderer-side access to the main process. Unwraps {@link IpcResult} into
 * resolved values or a typed {@link BridgeError}, so React Query and stores
 * can use ordinary promise semantics.
 */
import type { IpcChannel, IpcErrorCode, IpcEvent, IpcEventSpec, IpcInput, IpcOutput, NexusBridge } from '@shared/ipc';
import { createPreviewBridge } from './preview-bridge';

export type BridgeErrorCode = IpcErrorCode | 'BRIDGE_MISSING';

export class BridgeError extends Error {
  constructor(
    readonly code: BridgeErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'BridgeError';
  }
}

let previewBridge: NexusBridge | null = null;

/**
 * Returns the preload bridge. In `vite dev` opened in a plain browser (UI
 * work without Electron) a local preview bridge is used instead; packaged
 * builds never fall back.
 */
export function getBridge(): NexusBridge {
  if (window.nexus) return window.nexus;
  if (import.meta.env.DEV) return (previewBridge ??= createPreviewBridge());
  throw new BridgeError('BRIDGE_MISSING', 'window.nexus is not available');
}

export async function invoke<C extends IpcChannel>(
  channel: C,
  ...input: IpcInput<C> extends void ? [] : [IpcInput<C>]
): Promise<IpcOutput<C>> {
  const result = await getBridge().invoke(channel, ...input);
  if (!result.ok) throw new BridgeError(result.error.code, result.error.message);
  return result.data;
}

export function onEvent<E extends IpcEvent>(event: E, listener: (payload: IpcEventSpec[E]) => void): () => void {
  return getBridge().on(event, listener);
}
