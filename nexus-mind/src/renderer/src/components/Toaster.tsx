import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useToasts, type ToastTone } from '../stores/toasts';
import { cn } from '../lib/cn';

const ICONS: Record<ToastTone, typeof Info> = { info: Info, success: CheckCircle2, error: AlertCircle };
const TONES: Record<ToastTone, string> = { info: 'text-plasma', success: 'text-success', error: 'text-danger' };

/** Toast stack anchored to the bottom end corner (bottom-left in RTL). */
export function Toaster(): JSX.Element {
  const { toasts, dismiss } = useToasts();
  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-5 end-5 z-50 flex w-80 flex-col gap-2">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const Icon = ICONS[t.tone];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', stiffness: 500, damping: 36 }}
              role={t.tone === 'error' ? 'alert' : 'status'}
              className="glass pointer-events-auto flex items-start gap-3 rounded-xl bg-elevated/90 px-4 py-3 text-sm"
            >
              <Icon size={16} className={cn('mt-0.5 shrink-0', TONES[t.tone])} />
              <span className="flex-1 text-fg">{t.message}</span>
              <button type="button" onClick={() => dismiss(t.id)} className="focus-ring rounded text-subtle hover:text-fg" aria-label="Dismiss">
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
