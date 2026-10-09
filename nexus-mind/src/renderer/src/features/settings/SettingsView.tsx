import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Bot, Info, Languages, Palette, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui/Card';
import { invoke } from '../../lib/bridge';
import { cn } from '../../lib/cn';
import { AiSection } from './AiSection';
import { AppearanceSection } from './AppearanceSection';
import { LanguageSection } from './LanguageSection';

type SectionId = 'appearance' | 'language' | 'ai' | 'about';

const SECTIONS: readonly { id: SectionId; icon: LucideIcon }[] = [
  { id: 'appearance', icon: Palette },
  { id: 'language', icon: Languages },
  { id: 'ai', icon: Bot },
  { id: 'about', icon: Info },
];

function AboutSection(): JSX.Element {
  const { t } = useTranslation();
  const info = useQuery({ queryKey: ['app-info'], queryFn: () => invoke('app:info'), staleTime: Infinity });
  const rows: [string, string][] = info.data
    ? [
        [t('settings.about.version'), info.data.version],
        [t('settings.about.platform'), info.data.platform],
        [t('settings.about.osLocale'), info.data.osLocale],
      ]
    : [];
  return (
    <Card>
      <dl className="divide-y divide-border/50 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between py-3">
            <dt className="text-muted">{k}</dt>
            <dd className="font-mono" dir="ltr">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-sm text-muted">{t('settings.about.privacy')}</p>
    </Card>
  );
}

/** Settings with a vertical section list on the start edge. */
export default function SettingsView(): JSX.Element {
  const { t } = useTranslation();
  const [section, setSection] = useState<SectionId>('appearance');

  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-10 py-10">
      <aside className="w-64 shrink-0">
        <h1 className="font-display text-3xl tracking-tight">{t('settings.title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('settings.subtitle')}</p>
        <nav className="mt-6 flex flex-col gap-1" aria-label={t('settings.title')}>
          {SECTIONS.map(({ id, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSection(id)}
              aria-current={section === id ? 'true' : undefined}
              className={cn('focus-ring relative flex h-9 items-center gap-3 rounded-xl px-3 text-sm transition-colors', section === id ? 'text-fg' : 'text-muted hover:text-fg')}
            >
              {section === id && <motion.span layoutId="settings-active" className="absolute inset-0 rounded-xl bg-elevated ring-1 ring-border" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />}
              <Icon size={16} className="relative" />
              <span className="relative">{t(`settings.sections.${id}`)}</span>
            </button>
          ))}
        </nav>
      </aside>
      <motion.div key={section} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className="min-w-0 flex-1">
        {section === 'appearance' && <AppearanceSection />}
        {section === 'language' && <LanguageSection />}
        {section === 'ai' && <AiSection />}
        {section === 'about' && <AboutSection />}
      </motion.div>
    </div>
  );
}
