import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlarmClock, CalendarCheck, CheckCircle2, CircleDot, Flame, FolderKanban, Keyboard, NotebookPen, Timer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { WorkspaceSummary } from '@shared/domain';
import { AnimatedNumber } from '../../components/ui/AnimatedNumber';
import { Card } from '../../components/ui/Card';
import { Kbd } from '../../components/ui/Kbd';
import { useFormatters } from '../../hooks/useLocale';
import { invoke } from '../../lib/bridge';
import { cn } from '../../lib/cn';
import { useLoadedSettings } from '../../stores/settings';

type GreetingKey = 'morning' | 'afternoon' | 'evening' | 'night';

/** Greeting bucket for the local hour. */
export function greetingFor(hour: number): GreetingKey {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

interface StatDef {
  key: keyof WorkspaceSummary;
  label: 'openTasks' | 'dueToday' | 'overdue' | 'completedThisWeek' | 'focusThisWeek' | 'notes' | 'habits' | 'projects';
  icon: typeof Flame;
  tone: string;
  duration?: boolean;
}

const STATS: readonly StatDef[] = [
  { key: 'openTasks', label: 'openTasks', icon: CircleDot, tone: 'from-accent/25 text-accent' },
  { key: 'dueToday', label: 'dueToday', icon: CalendarCheck, tone: 'from-plasma/25 text-plasma' },
  { key: 'overdue', label: 'overdue', icon: AlarmClock, tone: 'from-danger/25 text-danger' },
  { key: 'completedThisWeek', label: 'completedThisWeek', icon: CheckCircle2, tone: 'from-success/25 text-success' },
  { key: 'focusMinutesThisWeek', label: 'focusThisWeek', icon: Timer, tone: 'from-amber/25 text-amber', duration: true },
  { key: 'projects', label: 'projects', icon: FolderKanban, tone: 'from-accent/25 text-accent' },
  { key: 'notes', label: 'notes', icon: NotebookPen, tone: 'from-plasma/25 text-plasma' },
  { key: 'habits', label: 'habits', icon: Flame, tone: 'from-amber/25 text-amber' },
];

const SHORTCUTS = [
  { combo: 'mod+k', label: 'palette' },
  { combo: 'mod+,', label: 'settings' },
  { combo: 'mod+\\', label: 'sidebar' },
] as const;

/**
 * Home: greeting, today's date in the user's calendar, and live workspace
 * counters from SQLite. Refetches when the window regains focus.
 */
export default function HomeView(): JSX.Element {
  const { t } = useTranslation();
  const f = useFormatters();
  const { globalHotkey } = useLoadedSettings();
  const now = new Date();
  const summary = useQuery({ queryKey: ['workspace', 'summary'], queryFn: () => invoke('workspace:summary') });

  return (
    <div className="mx-auto max-w-6xl px-10 py-10">
      <motion.header initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <p className="text-sm text-muted">{f.longDate(now)}</p>
        <h1 className="mt-1 font-display text-4xl tracking-tight">
          <span className="text-gradient">{t(`home.greeting.${greetingFor(now.getHours())}`)}</span>
        </h1>
        <p className="mt-2 text-muted">{summary.data ? t('home.dueToday', { count: summary.data.dueToday }) : ' '}</p>
      </motion.header>

      {summary.isError ? (
        <Card className="mt-8 border-danger/40 text-sm text-danger">{t('home.loadError')}</Card>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STATS.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 + i * 0.035, type: 'spring', stiffness: 380, damping: 30 }}
                whileHover={{ y: -3 }}
                className="glass group relative overflow-hidden rounded-2xl p-5"
              >
                <div className={cn('pointer-events-none absolute -end-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br to-transparent opacity-60 blur-2xl transition-opacity group-hover:opacity-100', s.tone)} />
                <div className={cn('grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br to-transparent', s.tone)}>
                  <Icon size={17} />
                </div>
                <div className="mt-4 font-display text-3xl tabular-nums">
                  {summary.data ? <AnimatedNumber value={summary.data[s.key]} format={s.duration ? f.duration : f.number} /> : <span className="text-subtle">—</span>}
                </div>
                <div className="mt-1 text-sm text-muted">{t(`home.stats.${s.label}`)}</div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Card className="mt-6">
        <div className="flex items-start gap-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">
            <Keyboard size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg">{t('home.keyboardTitle')}</h2>
            <p className="mt-1 text-sm text-muted">{t('home.keyboardBody')}</p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {SHORTCUTS.map((s) => (
                <li key={s.label} className="flex items-center justify-between rounded-xl bg-bg/50 px-3 py-2 text-sm">
                  <span className="text-muted">{t(`home.shortcuts.${s.label}`)}</span>
                  <Kbd combo={s.combo} />
                </li>
              ))}
              <li className="flex items-center justify-between rounded-xl bg-bg/50 px-3 py-2 text-sm">
                <span className="text-muted">{t('home.shortcuts.summon')}</span>
                <Kbd combo={globalHotkey.replace('CommandOrControl', 'mod')} />
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
