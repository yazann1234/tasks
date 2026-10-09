import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LOCALE_META, SUPPORTED_LOCALES } from '@shared/locale';
import { addDays } from '@shared/dates';
import { Card, Field } from '../../components/ui/Card';
import { Segmented } from '../../components/ui/Segmented';
import { useFormatters } from '../../hooks/useLocale';
import { cn } from '../../lib/cn';
import { useLoadedSettings, useSettings } from '../../stores/settings';

/** Language, direction, digits, calendar and week start, with a live preview. */
export function LanguageSection(): JSX.Element {
  const { t } = useTranslation();
  const s = useLoadedSettings();
  const update = useSettings((st) => st.update);
  const f = useFormatters();
  const now = new Date();

  return (
    <div className="space-y-5">
      <Card>
        <h3 className="mb-4 text-sm font-medium">{t('settings.language.title')}</h3>
        <div role="radiogroup" aria-label={t('settings.language.title')} className="grid gap-3 sm:grid-cols-2">
          {SUPPORTED_LOCALES.map((code) => {
            const meta = LOCALE_META[code];
            const active = s.locale === code;
            return (
              <button
                key={code}
                type="button"
                role="radio"
                aria-checked={active}
                lang={code}
                dir={meta.dir}
                onClick={() => void update({ locale: code, weekStart: meta.defaultWeekStart })}
                className={cn('focus-ring flex items-center justify-between rounded-xl border p-4 transition', active ? 'border-accent bg-accent/10' : 'border-border hover:border-muted/50')}
                style={{ fontFamily: code === 'ar' ? "'Tajawal', sans-serif" : undefined }}
              >
                <span>
                  <span className="block text-lg font-medium">{meta.nativeName}</span>
                  <span className="block font-mono text-xs uppercase text-subtle">{meta.dir}</span>
                </span>
                {active && <Check size={16} className="text-accent" />}
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="divide-y divide-border/50">
        <Field label={t('settings.language.direction')} hint={t('settings.language.directionHint')}>
          <Segmented
            label={t('settings.language.direction')}
            value={s.direction}
            onChange={(direction) => void update({ direction })}
            options={(['auto', 'rtl', 'ltr'] as const).map((v) => ({ value: v, label: t(`settings.language.${v}`) }))}
          />
        </Field>
        <Field label={t('settings.language.numerals')}>
          <Segmented
            label={t('settings.language.numerals')}
            value={s.numerals}
            onChange={(numerals) => void update({ numerals })}
            options={[
              { value: 'auto', label: t('settings.language.numeralsAuto') },
              { value: 'arab', label: t('settings.language.arab') },
              { value: 'latn', label: t('settings.language.latn') },
            ]}
          />
        </Field>
        <Field label={t('settings.language.calendar')}>
          <Segmented
            label={t('settings.language.calendar')}
            value={s.calendar}
            onChange={(calendar) => void update({ calendar })}
            options={(['gregory', 'islamic-umalqura'] as const).map((v) => ({ value: v, label: t(`settings.language.${v}`) }))}
          />
        </Field>
        <Field label={t('settings.language.weekStart')}>
          <Segmented
            label={t('settings.language.weekStart')}
            value={s.weekStart}
            onChange={(weekStart) => void update({ weekStart })}
            options={[
              { value: 6, label: t('settings.language.saturday') },
              { value: 0, label: t('settings.language.sunday') },
              { value: 1, label: t('settings.language.monday') },
            ]}
          />
        </Field>
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-medium">{t('settings.language.preview')}</h3>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          {[
            f.longDate(now),
            f.time(now),
            f.number(1234567.89),
            f.duration(95),
            f.relativeDays(addDays(now, 1), now),
            t('home.dueToday', { count: 3 }),
          ].map((sample, i) => (
            <div key={i} className="rounded-lg bg-bg/50 px-3 py-2 text-fg">
              {sample}
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
