import { ZodError } from 'zod';
import { ipcInputSchemas, type IpcChannel, type IpcInput, type IpcOutput, type IpcResult } from '@shared/ipc';
import { AppError } from '../errors';
import { log } from '../logger';

/** One handler per channel; TypeScript enforces the contract exhaustively. */
export type IpcHandlers = {
  [C in IpcChannel]: (input: IpcInput<C>) => IpcOutput<C> | Promise<IpcOutput<C>>;
};

/**
 * Validates `raw` against the channel schema, runs the handler and converts
 * every outcome into an {@link IpcResult}. Never throws. Kept free of
 * Electron imports so it is unit-testable.
 */
export async function dispatch<C extends IpcChannel>(
  handlers: IpcHandlers,
  channel: C,
  raw: unknown,
): Promise<IpcResult<IpcOutput<C>>> {
  const schema = ipcInputSchemas[channel];
  if (!schema) {
    return { ok: false, error: { code: 'NOT_FOUND', message: `Unknown channel: ${String(channel)}` } };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: { code: 'VALIDATION', message: formatZodError(parsed.error) } };
  }
  try {
    const handler = handlers[channel] as (input: IpcInput<C>) => IpcOutput<C> | Promise<IpcOutput<C>>;
    const data = await handler(parsed.data);
    return { ok: true, data };
  } catch (error) {
    if (error instanceof AppError) return { ok: false, error: { code: error.code, message: error.message } };
    if (error instanceof ZodError) return { ok: false, error: { code: 'VALIDATION', message: formatZodError(error) } };
    log.error(`IPC ${channel} failed`, error);
    // Internal details stay in the log; the UI gets a generic, localisable code.
    return { ok: false, error: { code: 'INTERNAL', message: 'Something went wrong.' } };
  }
}

function formatZodError(error: ZodError): string {
  return error.issues.map((i) => `${i.path.join('.') || 'input'}: ${i.message}`).join('; ');
}
