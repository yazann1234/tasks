import { motion } from 'framer-motion';
import { useId, useRef, type KeyboardEvent } from 'react';
import { useDirection } from '../../hooks/useLocale';
import { cn } from '../../lib/cn';

export interface SegmentedOption<T extends string | number> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string | number> {
  label: string;
  value: T;
  options: readonly SegmentedOption<T>[];
  onChange(value: T): void;
}

/**
 * Radio-group styled as a segmented control with a sliding indicator.
 * Arrow keys follow visual order, so → moves forward in LTR and backward in RTL.
 */
export function Segmented<T extends string | number>({ label, value, options, onChange }: SegmentedProps<T>): JSX.Element {
  const id = useId();
  const dir = useDirection();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const forward = dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const backward = dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
    if (event.key !== forward && event.key !== backward) return;
    event.preventDefault();
    const index = options.findIndex((o) => o.value === value);
    const next = (index + (event.key === forward ? 1 : -1) + options.length) % options.length;
    const option = options[next];
    if (option) {
      onChange(option.value);
      refs.current[next]?.focus();
    }
  };

  return (
    <div role="radiogroup" aria-label={label} onKeyDown={onKeyDown} className="inline-flex flex-wrap gap-1 rounded-xl border border-border/70 bg-bg/60 p-1">
      {options.map((option, i) => {
        const active = option.value === value;
        return (
          <button
            key={String(option.value)}
            ref={(el) => (refs.current[i] = el)}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={cn('focus-ring relative rounded-lg px-3 py-1.5 text-sm transition-colors', active ? 'text-fg' : 'text-muted hover:text-fg')}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-lg bg-elevated shadow-glass ring-1 ring-border"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
