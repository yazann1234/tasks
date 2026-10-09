import type { IpcErrorCode } from '@shared/ipc';

/** An error whose code is safe to show to the renderer. */
export class AppError extends Error {
  constructor(
    readonly code: IpcErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
