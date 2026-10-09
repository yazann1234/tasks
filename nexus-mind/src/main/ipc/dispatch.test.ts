import { describe, expect, it, vi } from 'vitest';
import { defaultSettings } from '@shared/settings';
import { AppError } from '../errors';
import { dispatch, type IpcHandlers } from './dispatch';

vi.mock('../logger', () => ({ log: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() } }));

const status = { openai: false, anthropic: false };
function handlers(overrides: Partial<IpcHandlers> = {}): IpcHandlers {
  return {
    'app:info': () => ({ name: 'NEXUS Mind', version: '0.1.0', platform: 'linux', osLocale: 'ar', secureStorageAvailable: true }),
    'settings:get': () => defaultSettings('en'),
    'settings:update': (patch) => ({ ...defaultSettings('en'), ...patch }),
    'secrets:status': () => status,
    'secrets:set': () => status,
    'secrets:delete': () => status,
    'workspace:summary': () => ({ projects: 0, openTasks: 0, dueToday: 0, overdue: 0, completedThisWeek: 0, notes: 0, habits: 0, focusMinutesThisWeek: 0 }),
    'shell:openExternal': () => undefined,
    ...overrides,
  };
}

describe('dispatch', () => {
  it('returns data for valid input', async () => {
    await expect(dispatch(handlers(), 'settings:update', { locale: 'ar' })).resolves.toMatchObject({ ok: true, data: { locale: 'ar' } });
  });

  it('rejects invalid input before reaching the handler', async () => {
    const spy = vi.fn();
    const result = await dispatch(handlers({ 'settings:update': spy }), 'settings:update', { theme: 'nope' });
    expect(result).toMatchObject({ ok: false, error: { code: 'VALIDATION' } });
    expect(spy).not.toHaveBeenCalled();
  });

  it('only allows https links to be opened', async () => {
    expect(await dispatch(handlers(), 'shell:openExternal', { url: 'file:///etc/passwd' })).toMatchObject({ ok: false });
    expect(await dispatch(handlers(), 'shell:openExternal', { url: 'https://example.com' })).toMatchObject({ ok: true });
  });

  it('maps AppError codes and hides internal errors', async () => {
    const appErr = await dispatch(
      handlers({ 'secrets:set': () => { throw new AppError('SECURE_STORAGE_UNAVAILABLE', 'no keychain'); } }),
      'secrets:set',
      { provider: 'openai', value: 'sk-1234567890' },
    );
    expect(appErr).toEqual({ ok: false, error: { code: 'SECURE_STORAGE_UNAVAILABLE', message: 'no keychain' } });

    const internal = await dispatch(handlers({ 'settings:get': () => { throw new Error('disk on fire /home/secret'); } }), 'settings:get', undefined);
    expect(internal).toEqual({ ok: false, error: { code: 'INTERNAL', message: 'Something went wrong.' } });
  });
});
