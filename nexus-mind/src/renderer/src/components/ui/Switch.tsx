import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';

interface SwitchProps {
  checked: boolean;
  onChange(checked: boolean): void;
  label: string;
  hint?: string;
}

/**
 * Accessible toggle (`role="switch"`). The thumb uses logical alignment, so
 * "on" slides toward the end edge: right in LTR, left in RTL.
 */
export function Switch({ checked, onChange, label, hint }: SwitchProps): JSX.Element {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-6 py-1">
      <span>
        <span className="block text-sm font-medium text-fg">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          'focus-ring flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors',
          checked ? 'justify-end bg-accent' : 'justify-start bg-border',
        )}
      >
        <motion.span layout transition={{ type: 'spring', stiffness: 700, damping: 35 }} className="h-5 w-5 rounded-full bg-white shadow" />
      </button>
    </label>
  );
}
