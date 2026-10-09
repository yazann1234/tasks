/**
 * Minimal structured logger for the main process. Writes to stderr so
 * output shows up in `npm run dev` and in OS crash reports.
 */
type Level = 'debug' | 'info' | 'warn' | 'error';

function write(level: Level, message: string, detail?: unknown): void {
  const line = `[${new Date().toISOString()}] ${level.toUpperCase()} ${message}`;
  if (detail === undefined) console[level === 'debug' ? 'log' : level](line);
  else console[level === 'debug' ? 'log' : level](line, detail);
}

export const log = {
  debug: (message: string, detail?: unknown) => write('debug', message, detail),
  info: (message: string, detail?: unknown) => write('info', message, detail),
  warn: (message: string, detail?: unknown) => write('warn', message, detail),
  error: (message: string, detail?: unknown) => write('error', message, detail),
};
