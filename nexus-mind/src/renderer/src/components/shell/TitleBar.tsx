import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getBridge } from '../../lib/bridge';
import { useUi } from '../../stores/ui';
import { Kbd } from '../ui/Kbd';

/**
 * Frameless title bar. Native window controls are physically fixed
 * (traffic lights top-left on macOS, overlay top-right elsewhere) regardless
 * of text direction, so this reserves physical — not logical — padding.
 */
export function TitleBar(): JSX.Element {
  const { t } = useTranslation();
  const openPalette = useUi((s) => s.setPaletteOpen);
  const isMac = getBridge().platform === 'darwin';

  return (
    <header
      className="drag relative z-20 flex h-11 shrink-0 items-center justify-center border-b border-border/40"
      style={isMac ? { paddingLeft: 84, paddingRight: 16 } : { paddingLeft: 16, paddingRight: 'max(150px, calc(100vw - env(titlebar-area-x, 0px) - env(titlebar-area-width, 100vw)))' }}
    >
      <button
        type="button"
        onClick={() => openPalette(true)}
        className="no-drag focus-ring group flex h-7 w-full max-w-md items-center gap-2 rounded-lg border border-border/60 bg-surface/50 px-3 text-xs text-subtle transition hover:border-accent/40 hover:bg-surface hover:text-muted"
      >
        <Search size={13} className="transition-transform group-hover:scale-110" />
        <span className="flex-1 truncate text-start">{t('titlebar.search')}</span>
        <Kbd combo="mod+k" />
      </button>
    </header>
  );
}
