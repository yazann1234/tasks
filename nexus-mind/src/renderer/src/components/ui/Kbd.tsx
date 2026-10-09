import { formatHotkey, isMacPlatform } from '../../lib/hotkeys';
import { cn } from '../../lib/cn';

/** Renders a keyboard shortcut (always LTR, even inside Arabic text). */
export function Kbd({ combo, className }: { combo: string; className?: string }): JSX.Element {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-border bg-elevated px-1.5 font-mono text-[10.5px] font-medium text-muted',
        className,
      )}
    >
      {formatHotkey(combo, isMacPlatform())}
    </kbd>
  );
}
