/**
 * Feature registry: every top-level view the sidebar, command palette and
 * hotkeys know about. Views are lazy-loaded so each module is its own chunk
 * and cold start only parses what is on screen.
 */
import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import { House, Settings2, type LucideIcon } from 'lucide-react';
import type { ViewId } from '../stores/ui';

export interface FeatureDefinition {
  id: ViewId;
  icon: LucideIcon;
  hotkey: string;
  /** Placement in the sidebar. */
  placement: 'main' | 'footer';
  component: LazyExoticComponent<ComponentType>;
}

export const FEATURES: readonly FeatureDefinition[] = [
  { id: 'home', icon: House, hotkey: 'mod+1', placement: 'main', component: lazy(() => import('./home/HomeView')) },
  { id: 'settings', icon: Settings2, hotkey: 'mod+,', placement: 'footer', component: lazy(() => import('./settings/SettingsView')) },
];

export function getFeature(id: ViewId): FeatureDefinition {
  const feature = FEATURES.find((f) => f.id === id);
  if (!feature) throw new Error(`Unknown view: ${id}`);
  return feature;
}
