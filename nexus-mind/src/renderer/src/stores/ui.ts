import { create } from 'zustand';

export type ViewId = 'home' | 'settings';

interface UiState {
  view: ViewId;
  paletteOpen: boolean;
  navigate(view: ViewId): void;
  setPaletteOpen(open: boolean): void;
}

/** Ephemeral UI state (not persisted). */
export const useUi = create<UiState>((set) => ({
  view: 'home',
  paletteOpen: false,
  navigate: (view) => set({ view, paletteOpen: false }),
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
}));
