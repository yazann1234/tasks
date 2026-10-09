import { DialogTitle } from '@radix-ui/react-dialog';
import { Command } from 'cmdk';
import { ArrowRightLeft, Languages, Palette, PanelLeft, Sparkles } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { THEME_IDS } from '@shared/settings';
import { resolveDirection } from '@shared/locale';
import { FEATURES } from '../../features/registry';
import { i18n } from '../../i18n';
import { useLoadedSettings, useSettings } from '../../stores/settings';
import { useUi } from '../../stores/ui';
import { Kbd } from '../ui/Kbd';

interface PaletteCommand {
  id: string;
  group: 'navigation' | 'preferences';
  label: string;
  icon: ReactNode;
  hotkey?: string;
  run(): void;
}

/**
 * ⌘K command palette (feature #16). Fuzzy-matches in both languages: each
 * command carries its English and Arabic labels as keywords, so typing
 * "settings" works in the Arabic UI and "إعدادات" works in the English one.
 */
export function CommandPalette(): JSX.Element {
  const { t } = useTranslation();
  const open = useUi((s) => s.paletteOpen);
  const setOpen = useUi((s) => s.setPaletteOpen);
  const navigate = useUi((s) => s.navigate);
  const settings = useLoadedSettings();
  const update = useSettings((s) => s.update);

  const commands = useMemo<PaletteCommand[]>(() => {
    const close = (fn: () => void) => () => {
      fn();
      setOpen(false);
    };
    const nextTheme = THEME_IDS[(THEME_IDS.indexOf(settings.theme) + 1) % THEME_IDS.length] ?? 'obsidian';
    const currentDir = resolveDirection(settings.locale, settings.direction);
    return [
      ...FEATURES.map((f) => {
        const Icon = f.icon;
        return {
          id: `go-${f.id}`,
          group: 'navigation' as const,
          label: t(`nav.${f.id}`),
          icon: <Icon size={16} />,
          hotkey: f.hotkey,
          run: close(() => navigate(f.id)),
        };
      }),
      { id: 'lang', group: 'preferences', label: t('palette.switchLanguage'), icon: <Languages size={16} />, run: close(() => void update({ locale: settings.locale === 'ar' ? 'en' : 'ar' })) },
      { id: 'dir', group: 'preferences', label: t('palette.toggleDirection'), icon: <ArrowRightLeft size={16} />, run: close(() => void update({ direction: currentDir === 'rtl' ? 'ltr' : 'rtl' })) },
      { id: 'theme', group: 'preferences', label: `${t('palette.nextTheme')} — ${t(`settings.theme.${nextTheme}`)}`, icon: <Palette size={16} />, run: () => void update({ theme: nextTheme }) },
      { id: 'sidebar', group: 'preferences', label: t('palette.toggleSidebar'), icon: <PanelLeft size={16} className="rtl:-scale-x-100" />, hotkey: 'mod+\\', run: close(() => void update({ sidebarCollapsed: !settings.sidebarCollapsed })) },
      { id: 'motion', group: 'preferences', label: t('palette.toggleReduceMotion'), icon: <Sparkles size={16} />, run: close(() => void update({ reduceMotion: !settings.reduceMotion })) },
    ];
  }, [t, settings, navigate, setOpen, update]);

  const keywordsFor = (id: string): string[] => {
    const key = id.startsWith('go-') ? `nav.${id.slice(3)}` : ({ lang: 'palette.switchLanguage', dir: 'palette.toggleDirection', theme: 'palette.nextTheme', sidebar: 'palette.toggleSidebar', motion: 'palette.toggleReduceMotion' } as const)[id];
    if (!key) return [];
    return ['en', 'ar'].map((lng) => i18n.getFixedT(lng)(key as 'nav.home'));
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label={t('palette.label')}
      loop
      overlayClassName="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
      contentClassName="fixed inset-x-0 top-[14vh] z-50 mx-auto w-[min(640px,92vw)]"
      className="glass overflow-hidden rounded-2xl bg-elevated/90"
    >
      <DialogTitle className="sr-only">{t('palette.label')}</DialogTitle>
      <div className="flex items-center gap-3 border-b border-border/60 px-4">
        <Sparkles size={16} className="text-accent" />
        <Command.Input autoFocus placeholder={t('palette.placeholder')} className="h-14 flex-1 bg-transparent text-[15px] text-fg outline-none placeholder:text-subtle" />
        <Kbd combo="escape" />
      </div>
      <Command.List className="max-h-[50vh] overflow-y-auto p-2">
        <Command.Empty className="px-4 py-10 text-center text-sm text-muted">{t('palette.empty')}</Command.Empty>
        {(['navigation', 'preferences'] as const).map((group) => (
          <Command.Group
            key={group}
            heading={t(`palette.${group}`)}
            className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-subtle"
          >
            {commands
              .filter((c) => c.group === group)
              .map((c) => (
                <Command.Item
                  key={c.id}
                  value={c.id}
                  keywords={[c.label, ...keywordsFor(c.id)]}
                  onSelect={c.run}
                  className="flex h-11 cursor-pointer items-center gap-3 rounded-xl px-3 text-sm text-muted transition-colors data-[selected=true]:bg-accent/15 data-[selected=true]:text-fg"
                >
                  <span className="text-subtle">{c.icon}</span>
                  <span className="flex-1">{c.label}</span>
                  {c.hotkey && <Kbd combo={c.hotkey} />}
                </Command.Item>
              ))}
          </Command.Group>
        ))}
      </Command.List>
    </Command.Dialog>
  );
}
