import { animate, useReducedMotion } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface Props {
  value: number;
  format(value: number): string;
}

/**
 * Counts up to `value` with a spring, writing to the DOM directly (no React
 * re-render per frame). Respects reduced-motion preferences.
 */
export function AnimatedNumber({ value, format }: Props): JSX.Element {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const from = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce || document.documentElement.dataset['reduceMotion'] === 'true') {
      el.textContent = format(value);
      from.current = value;
      return;
    }
    const controls = animate(from.current, value, {
      type: 'spring',
      stiffness: 90,
      damping: 20,
      onUpdate: (v) => (el.textContent = format(Math.round(v))),
    });
    from.current = value;
    return () => controls.stop();
  }, [value, format, reduce]);

  return <span ref={ref}>{format(0)}</span>;
}
