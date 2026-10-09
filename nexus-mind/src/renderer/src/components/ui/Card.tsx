import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

/** Glass surface used for every panel. */
export function Card({ children, className }: { children: ReactNode; className?: string }): JSX.Element {
  return <section className={cn('glass rounded-2xl p-5', className)}>{children}</section>;
}

/** Labelled settings row: label + hint on the start side, control on the end side. */
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }): JSX.Element {
  return (
    <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="text-sm font-medium text-fg">{label}</div>
        {hint && <div className="text-xs text-muted">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
