import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AI_PROVIDERS, type AiProvider } from '@shared/ipc';
import { Card } from '../../components/ui/Card';
import { BridgeError, invoke } from '../../lib/bridge';
import { cn } from '../../lib/cn';
import { toast } from '../../stores/toasts';

function ProviderRow({ provider, connected, disabled }: { provider: AiProvider; connected: boolean; disabled: boolean }): JSX.Element {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [value, setValue] = useState('');

  const onError = (error: unknown): void => {
    toast.error(t(`errors.${error instanceof BridgeError && error.code !== 'BRIDGE_MISSING' ? error.code : 'INTERNAL'}`));
  };
  const save = useMutation({
    mutationFn: () => invoke('secrets:set', { provider, value }),
    onSuccess: (status) => {
      qc.setQueryData(['secrets'], status);
      setValue('');
      toast.success(t('settings.ai.saved'));
    },
    onError,
  });
  const remove = useMutation({
    mutationFn: () => invoke('secrets:delete', { provider }),
    onSuccess: (status) => {
      qc.setQueryData(['secrets'], status);
      toast.info(t('settings.ai.removed'));
    },
    onError,
  });

  return (
    <form
      className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim().length >= 8) save.mutate();
      }}
    >
      <div className="flex w-40 shrink-0 items-center gap-2">
        <KeyRound size={15} className="text-subtle" />
        <span className="text-sm font-medium">{t(`settings.ai.${provider}`)}</span>
      </div>
      <span className={cn('w-fit rounded-full px-2 py-0.5 text-xs', connected ? 'bg-success/15 text-success' : 'bg-border/60 text-muted')}>
        {t(connected ? 'settings.ai.connected' : 'settings.ai.notConnected')}
      </span>
      <input
        type="password"
        dir="ltr"
        autoComplete="off"
        spellCheck={false}
        disabled={disabled}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t('settings.ai.placeholder')}
        aria-label={`${t(`settings.ai.${provider}`)} — ${t('settings.ai.placeholder')}`}
        className="focus-ring h-9 min-w-0 flex-1 rounded-lg border border-border bg-bg/60 px-3 font-mono text-sm placeholder:font-sans placeholder:text-subtle disabled:opacity-50"
      />
      <div className="flex gap-2">
        <button type="submit" disabled={disabled || value.trim().length < 8 || save.isPending} className="focus-ring h-9 rounded-lg bg-accent px-4 text-sm font-medium text-white transition hover:bg-accent/90 disabled:opacity-40">
          {t('common.save')}
        </button>
        {connected && (
          <button type="button" onClick={() => remove.mutate()} disabled={remove.isPending} className="focus-ring h-9 rounded-lg border border-border px-3 text-sm text-muted transition hover:border-danger/50 hover:text-danger">
            {t('common.remove')}
          </button>
        )}
      </div>
    </form>
  );
}

/** API key management. Keys go straight to the OS keychain via the main process. */
export function AiSection(): JSX.Element {
  const { t } = useTranslation();
  const info = useQuery({ queryKey: ['app-info'], queryFn: () => invoke('app:info'), staleTime: Infinity });
  const status = useQuery({ queryKey: ['secrets'], queryFn: () => invoke('secrets:status') });
  const unavailable = info.data?.secureStorageAvailable === false;

  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', unavailable ? 'bg-amber/15 text-amber' : 'bg-success/15 text-success')}>
          {unavailable ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
        </div>
        <div>
          <h3 className="font-medium">{t('settings.ai.title')}</h3>
          <p className="mt-1 text-sm text-muted">{t('settings.ai.description')}</p>
          {unavailable && <p className="mt-2 text-sm text-amber">{t('settings.ai.keychainUnavailable')}</p>}
        </div>
      </div>
      <div className="mt-2 divide-y divide-border/50">
        {AI_PROVIDERS.map((p) => (
          <ProviderRow key={p} provider={p} connected={status.data?.[p] ?? false} disabled={unavailable} />
        ))}
      </div>
    </Card>
  );
}
