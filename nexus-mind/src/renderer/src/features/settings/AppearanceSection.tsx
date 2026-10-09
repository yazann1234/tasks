import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { resolveDirection, resolveUiFont, type UiFont } from '@shared/locale';
import { THEME_IDS } from '@shared/settings';
import { Card, Field } from '../../components/ui/Card';
import { Segmented } from '../../components/ui/Segmented';
import { Switch } from '../../components/ui/Switch';
import { cn } from '../../lib/cn';
import { useLoadedSettings, useSettings } from '../../stores/settings';
import { THEMES } from '../../theme/themes';

const FONT_STACKS: Record<Exclude<UiFont, 'auto'>, string> = {
  tajawal: "'Tajawal', sans-serif",
  inter: "'Inter Variable', 'Tajawal', sans-serif",
  system: "system-ui, -apple-system, 'Segoe UI', 'Tajawal', sans-serif",
};

/** Theme gallery, font picker (Tajawal first), density, text size and motion. */
export function AppearanceSection(): JSX.Element {
  const { t } = useTranslation();
  const s = useLoadedSettings();
  const update = useSettings((st) => st.update);
  const autoFont = resolveUiFont(s.locale, 'auto', resolveDirection(s.locale, s.direction));

  return (
    <div className="space-y-5">
      <Card>
        <h3 className="mb-4 text-sm font-medium">{t('settings.theme.title')}</h3>
        <div role="radiogroup" aria-label={t('settings.theme.title')} className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {THEME_IDS.map((id) => {
            const theme = THEMES[id];
            const active = s.theme === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => void update({ theme: id })}
                className={cn('focus-ring group overflow-hidden rounded-xl border text-start transition hover:-translate-y-0.5', active ? 'border-accent shadow-glow' : 'border-border hover:border-muted/50')}
              >
                <div className="relative h-20 p-3" style={{ background: theme.colors.bg }}>
                  <div className="h-full w-2/3 rounded-lg p-2" style={{ background: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
                    <div className="h-1.5 w-1/2 rounded-full" style={{ background: theme.colors.fg, opacity: 0.8 }} />
                    <div className="mt-1.5 flex gap-1">
                      {[theme.colors.accent, theme.colors.plasma, theme.colors.amber].map((c) => (
                        <span key={c} className="h-3 w-3 rounded-full" style={{ background: c }} />
                      ))}
                    </div>
                  </div>
                  {active && (
                    <span className="absolute end-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-accent text-white">
                      <Check size={12} />
                    </span>
                  )}
                </div>
                <div className="bg-surface px-3 py-2 text-sm">{t(`settings.theme.${id}`)}</div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-medium">{t('settings.font.title')}</h3>
        <div role="radiogroup" aria-label={t('settings.font.title')} className="grid gap-3 sm:grid-cols-2">
          {(['auto', 'tajawal', 'inter', 'system'] as const).map((font) => {
            const active = s.uiFont === font;
            const stack = FONT_STACKS[font === 'auto' ? autoFont : font];
            return (
              <button
                key={font}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => void update({ uiFont: font })}
                className={cn('focus-ring rounded-xl border p-4 text-start transition', active ? 'border-accent bg-accent/10' : 'border-border hover:border-muted/50')}
              >
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>{t(`settings.font.${font}`)}</span>
                  {active && <Check size={14} className="text-accent" />}
                </div>
                <div className="mt-2 truncate text-lg" style={{ fontFamily: stack }}>
                  {t('settings.font.sample')}
                </div>
                {font === 'auto' && <div className="mt-1 text-xs text-subtle">{t('settings.font.autoHint')}</div>}
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="divide-y divide-border/50">
        <Field label={t('settings.density.title')}>
          <Segmented
            label={t('settings.density.title')}
            value={s.density}
            onChange={(density) => void update({ density })}
            options={(['compact', 'comfortable', 'spacious'] as const).map((v) => ({ value: v, label: t(`settings.density.${v}`) }))}
          />
        </Field>
        <Field label={t('settings.fontScale')}>
          <Segmented
            label={t('settings.fontScale')}
            value={s.fontScale}
            onChange={(fontScale) => void update({ fontScale })}
            options={[90, 100, 110, 120].map((v) => ({ value: v, label: `${v}%` }))}
          />
        </Field>
        <div className="py-3">
          <Switch label={t('settings.reduceMotion')} hint={t('settings.reduceMotionHint')} checked={s.reduceMotion} onChange={(reduceMotion) => void update({ reduceMotion })} />
        </div>
        <div className="py-3">
          <Switch label={t('settings.sounds')} hint={t('settings.soundsHint')} checked={s.sounds} onChange={(sounds) => void update({ sounds })} />
        </div>
      </Card>
    </div>
  );
}
