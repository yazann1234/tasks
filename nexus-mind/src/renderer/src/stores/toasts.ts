import { create } from 'zustand';

export type ToastTone = 'info' | 'success' | 'error';

export interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastState {
  toasts: Toast[];
  push(tone: ToastTone, message: string, ttlMs?: number): void;
  dismiss(id: number): void;
}

let nextId = 1;

/** In-app toast queue (max 4 visible; oldest are dropped). */
export const useToasts = create<ToastState>((set, get) => ({
  toasts: [],
  push: (tone, message, ttlMs = 3200) => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts.slice(-3), { id, tone, message }] }));
    window.setTimeout(() => get().dismiss(id), ttlMs);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Shorthand usable outside React. */
export const toast = {
  info: (m: string) => useToasts.getState().push('info', m),
  success: (m: string) => useToasts.getState().push('success', m),
  error: (m: string) => useToasts.getState().push('error', m, 5000),
};
