import { motion } from 'framer-motion';
import { Languages, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FEATURES, type FeatureDefinition } from '../../features/registry';
import { cn } from '../../lib/cn';
import { useLoadedSettings, useSettings } from '../../stores/settings';
import { useUi } from '../../stores/ui';
import { Kbd } from '../ui/Kbd';

function NavItem({ feature, collapsed }: { feature: FeatureDefinition; collapsed: boolean }): JSX.Element {
  const { t } = useTranslation();
  const active = useUi((s) => s.view === feature.id);
  const navigate = useUi((s) => s.navigate);
  const Icon = feature.icon;
  const label = t(`nav.${feature.id}`);

  return (
    <button
      type="button"
      onClick={() => navigate(feature.id)}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? label : undefined}
      className={cn(
        'focus-ring group relative flex h-9 w-full items-center gap-3 rounded-xl px-3 text-sm transition-colors',
        active ? 'text-fg' : 'text-muted hover:bg-elevated/60 hover:text-fg',
      )}
    >
      {active && (
        <motion.span
          layoutId="nav-active"
          className="absolute inset-0 rounded-xl bg-elevated ring-1 ring-border"
          transition={{ type: 'spring', stiffness: 500, damping: 40 }}
        >
          <span className="absolute inset-y-2 start-0 w-0.5 rounded-full bg-gradient-to-b from-accent to-plasma" />
        </motion.span>
      )}
      <Icon size={17} className={cn('relative shrink-0 transition-transform group-hover:scale-110', active && 'text-accent')} />
      {!collapsed && (
        <>
          <span className="relative flex-1 truncate text-start">{label}</span>
          <Kbd combo={feature.hotkey} className="relative opacity-0 transition-opacity group-hover:opacity-100" />
        </>
      )}
    </button>
  );
}

/** Primary navigation. Sits on the start edge: left in LTR, right in RTL. */
export function Sidebar(): JSX.Element {
  const { t } = useTranslation();
  const settings = useLoadedSettings();
  const update = useSettings((s) => s.update);
  const collapsed = settings.sidebarCollapsed;
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <motion.nav
      aria-label={t('nav.workspace')}
      animate={{ width: collapsed ? 68 : 232 }}
      transition={{ type: 'spring', stiffness: 400, damping: 40 }}
      className="relative z-10 flex shrink-0 flex-col gap-1 border-e border-border/40 bg-surface/40 p-3 backdrop-blur-xl"
    >
      <div className={cn('mb-4 flex items-center gap-2.5 px-1.5 pt-1', collapsed && 'justify-center')}>
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-accent via-accent to-plasma shadow-glow">
          <span className="font-display text-sm text-white">N</span>
        </div>
        {!collapsed && <span className="font-display text-[15px] tracking-tight">{t('common.appName')}</span>}
      </div>

      {!collapsed && <div className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-subtle">{t('nav.workspace')}</div>}
      {FEATURES.filter((f) => f.placement === 'main').map((f) => (
        <NavItem key={f.id} feature={f} collapsed={collapsed} />
      ))}

      <div className="mt-auto flex flex-col gap-1">
        {FEATURES.filter((f) => f.placement === 'footer').map((f) => (
          <NavItem key={f.id} feature={f} collapsed={collapsed} />
        ))}
        <button
          type="button"
          onClick={() => void update({ locale: settings.locale === 'ar' ? 'en' : 'ar' })}
          title={t('nav.switchLanguage')}
          className="focus-ring flex h-9 items-center gap-3 rounded-xl px-3 text-sm text-muted transition hover:bg-elevated/60 hover:text-fg"
        >
          <Languages size={17} className="shrink-0" />
          {!collapsed && <span className="flex-1 text-start">{settings.locale === 'ar' ? 'English' : 'العربية'}</span>}
        </button>
        <button
          type="button"
          onClick={() => void update({ sidebarCollapsed: !collapsed })}
          aria-label={t(collapsed ? 'nav.expand' : 'nav.collapse')}
          className="focus-ring flex h-9 items-center gap-3 rounded-xl px-3 text-sm text-muted transition hover:bg-elevated/60 hover:text-fg"
        >
          {/* Panel icons point left; mirror them in RTL where the sidebar is on the right. */}
          <ToggleIcon size={17} className="shrink-0 rtl:-scale-x-100" />
          {!collapsed && <span className="flex-1 text-start">{t('nav.collapse')}</span>}
        </button>
      </div>
    </motion.nav>
  );
}
